import contextlib
import logging
import sys
import types
from typing import Dict, List, NamedTuple, Optional, Tuple

import pandas as pd

from inquest.file_module_resolver import FileModuleResolver
from inquest.hotpatch import embed_fstrings, get_function_in_module

LOGGER = logging.getLogger(__name__)

FunctionPath = Tuple[str, str]

TRACE_COLUMNS = [
    'id',
    'module',
    'function',
    'statement',
]

CODE_COLUMNS = [
    'module',
    'function',
    'code',
]

TRACE_WITH_ERROR_COLUMNS = [
    *TRACE_COLUMNS,
    'error',
]


class FunctionResolutionException(Exception):

    def __init__(self, trace_id: str, message: str):
        super().__init__(trace_id, message)
        self.trace_id = trace_id
        self.exception = message


class TraceSetException(Exception):

    def __init__(self, data: Dict):
        self.data = data
        super().__init__(data)


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

    # recreate module, function, and statement
    merged['module'] = merged['module_y'].fillna(merged['module_x'])
    merged['function'] = merged['function_y'].fillna(merged['function_x'])
    merged['statement'] = merged['statement_y'].fillna(merged['statement_x'])

    # to_be_removed is all ids that are removed
    to_be_removed = merged[merged['_merge'] == 'left_only'][trace_df.columns]
    to_be_added = merged[merged['_merge'] == 'right_only'][trace_df.columns]

    # changed traces
    to_be_updated = merged.query(
        '_merge == "both" & '
        + '( module_x != module_y | function_x != function_y '
        + '| statement_x != statement_y ) '
    )[trace_df.columns]

    new_traces = merged[merged['_merge'] != 'left_only'][trace_df.columns]
    return DiffResult(
        to_be_removed=to_be_removed,
        to_be_added=to_be_added,
        to_be_updated=to_be_updated,
        new_traces=new_traces,
    )


class Probe(contextlib.ExitStack):
    package: str
    traces: pd.DataFrame
    code: Dict[FunctionPath, types.CodeType]

    def __init__(self, root: str, package: str):
        super().__init__()
        self.package = package
        self.traces = pd.DataFrame(
            [],
            columns=TRACE_WITH_ERROR_COLUMNS,
        )
        self.module_resolver: FileModuleResolver = FileModuleResolver(
            package, root
        )
        self.code = {}

    def __enter__(self):
        super().__enter__()
        # when the with statement closes
        # self.reset is called
        self.callback(self.reset)
        return self

    def reset(self):
        errors = self.new_desired_state([])
        if errors is not None:
            raise Exception(errors)

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
                raise FunctionResolutionException(trace_id, exc)

            value = self.find_obj(
                sys.modules[module],
                function_name,
            )
            if value is None:
                raise FunctionResolutionException(
                    trace_id, Exception('could not find function')
                )

            new_desired_set.append(
                {
                    "id": trace_id,
                    "function": function_name,
                    "statement": trace['statement'],
                    "module": module,
                }
            )

        desired_set = new_desired_set

        LOGGER.debug('input desired_set %s', desired_set)
        traces, final_code, errors = self._add_desired_set(desired_set)
        LOGGER.debug('final desired_set %s', list(traces.id))

        if errors != {}:
            raise TraceSetException(errors)

        # TODO figure out where to send errors when this fails
        # only after ensuring there are no errors at all do we set code objects
        for (module, function), code in final_code.items():
            function_obj = get_function_in_module(
                self.get_path(module, function),
                self.package,
            )
            function_obj.__code__ = code
        self.traces = traces

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

        reverted_code = self._delete_traces(diff.to_be_removed)
        new_traces, errors = self._set_traces(diff.new_traces)
        final_code = {
            **reverted_code,
            **new_traces,
        }
        return diff.new_traces, final_code, errors

    def _get_og_code(self, module: str, function: str):
        key = (module, function)
        if key in self.code:
            return self.code[key]
        function_obj = get_function_in_module(
            self.get_path(module, function),
            self.package,
        )
        self.code[key] = function_obj.__code__
        return function_obj.__code__

    def _delete_traces(self, traces: pd.DataFrame):
        '''
        sets up the code changes to revert the the traces
        '''
        new_code = {}
        for (module, function), _ in group_by_location(traces):
            code = self._get_og_code(module, function)
            new_code[(module, function)] = code
        return new_code

    def _set_traces(self, traces: pd.DataFrame):
        '''
        sets the code dict for the new traces
        '''
        new_code = {}
        errors = {}
        for (module, function), group in group_by_location(traces):
            try:
                code = self._get_og_code(module, function)
                fstrings = list(group['statement'])
                ids = list(group['id'])
                embedded_code = embed_fstrings(code, fstrings, ids)
                new_code[(module, function)] = embedded_code
            except Exception as error:  # pylint: disable=all
                errors[(module, function)] = error
        return new_code, errors

    @staticmethod
    def get_path(module, function):
        return f'{module}:{function}'
