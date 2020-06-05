import logging
import sys
import types
from typing import Dict, List, NamedTuple, Optional, Tuple

import pandas as pd

import inquest.injection.codegen as codegen
from inquest.file_module_resolver import FileModuleResolver
from inquest.hotpatch import get_function_in_module
from inquest.injection.code_reassigner import CodeReassigner
from inquest.utils.exceptions import MultiTraceException, ProbeException
from inquest.utils.has_stack import HasStack

LOGGER = logging.getLogger(__name__)

FunctionPath = Tuple[str, str]

TRACE_COLUMNS = ['id', 'module', 'function', 'statement', 'lineno']

CODE_COLUMNS = [
    'module',
    'function',
    'code',
]

TRACE_WITH_ERROR_COLUMNS = [
    *TRACE_COLUMNS,
    'error',
]


class DiffResult(NamedTuple):
    to_be_removed: pd.DataFrame
    to_be_added: pd.DataFrame
    to_be_updated: pd.DataFrame
    new_traces: pd.DataFrame


def group_by_location(trace_df: pd.DataFrame):
    return trace_df.groupby(['module', 'function'])


def diff_desired_set(
    trace_df: pd.DataFrame,
    desired_set_df: pd.DataFrame,
) -> DiffResult:
    merged = pd.merge(
        trace_df,
        desired_set_df,
        how="outer",
        on=['id'],
        indicator=True,
    )
    """
    creates trace dataframes of the new and old traces
    """

    # recreate module, function, and statement
    merged['module'] = merged['module_y'].fillna(merged['module_x'])
    merged['function'] = merged['function_y'].fillna(merged['function_x'])
    merged['statement'] = merged['statement_y'].fillna(merged['statement_x'])
    merged['lineno'] = merged['lineno_y'].fillna(merged['lineno_x'])

    # to_be_removed is all ids that are removed
    to_be_removed = merged[merged['_merge'] == 'left_only'][trace_df.columns]
    to_be_added = merged[merged['_merge'] == 'right_only'][trace_df.columns]

    # changed traces
    to_be_updated = merged.query(
        '_merge == "both" & '
        + '( module_x != module_y | function_x != function_y '
        + '| statement_x != statement_y | lineno_x != lineno_y )'
    )[trace_df.columns]

    new_traces = merged[merged['_merge'] != 'left_only'][trace_df.columns]
    return DiffResult(
        to_be_removed=to_be_removed,
        to_be_added=to_be_added,
        to_be_updated=to_be_updated,
        new_traces=new_traces,
    )


class Probe(HasStack):
    package: str
    traces: pd.DataFrame
    code: Dict[FunctionPath, types.CodeType]

    def __init__(self, package: str):
        super().__init__()
        self.package = package
        self.traces = pd.DataFrame(
            [],
            columns=TRACE_WITH_ERROR_COLUMNS,
        )
        self.module_resolver: FileModuleResolver = FileModuleResolver(package)
        self._code_reassigner = CodeReassigner()
        self.code = {}

    def enter(self):
        # first clear the desired state
        self._stack.callback(self.reset)
        # clear all code assignments
        self._stack.enter_context(self._code_reassigner)

    def reset(self):
        errors = self.new_desired_state([])
        if errors is not None:
            raise MultiTraceException(errors)

    def find_obj(self, obj, dotpath: str):
        idx = dotpath.find('.')
        if idx == -1:
            return getattr(
                obj,
                dotpath,
                None,
            )
        else:
            value = getattr(obj, dotpath[:idx], None)
            if value is None:
                return value
            return self.find_obj(value, dotpath[idx + 1:])

    def _construct_desired_set(
        self,
        desired_set: List[Dict[str, str]],
    ):
        """
        constructs the desired_set 
        @returns a list of trace dictionaries
        """
        new_desired_set = []
        for trace in desired_set:
            trace_id = trace['id']

            function_name = trace['function']['name']

            if trace['function']['parentClass'] is not None:
                parent_class_name = trace['function']['parentClass']['name']
                function_name = f"{parent_class_name}.{function_name}"

            try:
                module = self.module_resolver.convert_filename_to_modulename(
                    trace['function']['file']['name']
                )
            except Exception as exc:
                raise ProbeException(
                    message=str(exc), trace_id=trace_id
                ) from exc

            value = self.find_obj(
                sys.modules[module],
                function_name,
            )
            if value is None:
                raise ProbeException(
                    message='could not find function',
                    trace_id=trace_id,
                )

            new_desired_set.append(
                {
                    "id": trace_id,
                    "function": function_name,
                    "statement": trace['statement'],
                    "module": module,
                    'lineno': trace['line']
                }
            )
        return new_desired_set

    def new_desired_state(
        self,
        desired_set: List[Dict[str, str]],
    ) -> Optional[Dict[FunctionPath, Exception]]:
        '''
        changes the probe to match the new desired state
        @param desired_set: the set of desired traces
        @returns: if the change failed and was not implemented an error
                  a dict mapping (function, module) to Exception is returned
        TODO make the error dict point directly to the problematic trace id
        '''
        desired_set = self._construct_desired_set(desired_set)
        LOGGER.debug('input desired_set %s', desired_set)
        traces_df, new_traces, functions_to_be_reverted, errors = self._add_desired_set(
            desired_set
        )
        LOGGER.debug('final desired_set %s', list(traces_df.id))

        if errors != {}:
            raise MultiTraceException(errors)

        for func in functions_to_be_reverted:
            self._code_reassigner.revert_function(func)

        # TODO figure out where to send errors when this fails
        # only after ensuring there are no errors at all do we set code objects
        for (module, function), code in new_traces.items():
            function_obj = self._get_function(module, function)
            self._code_reassigner.assign_function(function_obj, code)
        self.traces = traces_df

    def _add_desired_set(self, desired_set: List[Dict[str, str]]):
        '''
        composes the new trace state given the input desired_set
        @returns a tuple of the new traces, the final code objects,
                 and the error dict
        '''
        desired_df = pd.DataFrame(
            desired_set,
            columns=TRACE_COLUMNS,
        )
        diff = diff_desired_set(
            self.traces,
            desired_df,
        )

        functions_to_be_reverted = list(
            self._functions_to_be_removed(diff.to_be_removed)
        )
        new_traces, errors = self._set_traces(diff.new_traces)
        return diff.new_traces, new_traces, functions_to_be_reverted, errors

    def _get_function(
        self, module: str, function: str, trace_id: Optional[str] = None
    ):
        try:
            return get_function_in_module(
                self.get_path(module, function),
                self.package,
            )
        except Exception as exc:
            raise ProbeException(message=str(exc), trace_id=trace_id) from exc

    def _functions_to_be_removed(self, traces: pd.DataFrame):
        for (module, function), _ in group_by_location(traces):
            yield self._get_function(module, function)

    def _set_traces(self, traces: pd.DataFrame):
        '''
        sets the code dict for the new traces
        '''
        new_code = {}
        errors = {}
        for (module, function), group in group_by_location(traces):
            try:
                statements = [
                    codegen.Trace(
                        statement=statement,
                        id=id,
                        lineno=lineno,
                    ) for statement, id, lineno in
                    zip(group['statement'], group['id'], group['lineno'])
                ]
                embedded_code = codegen.add_log_statements(
                    self._get_function(module, function),
                    statements,
                )
                new_code[(module, function)] = embedded_code
            except Exception as error:  # pylint: disable=all
                errors[(module, function)] = error
        return new_code, errors

    @staticmethod
    def get_path(module, function):
        return f'{module}:{function}'
