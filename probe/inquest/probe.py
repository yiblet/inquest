import contextlib
import logging
import types
from typing import Dict, List, NamedTuple, Optional, Tuple

import pandas as pd

from inquest.hotpatch import (
    convert_relative_import_to_absolute_import, embed_fstrings,
    get_function_in_module
)

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

    def __init__(self, package: str):
        super().__init__()
        self.package = package
        self.traces = pd.DataFrame(
            [],
            columns=TRACE_WITH_ERROR_COLUMNS,
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

        # converts module path to absolute path in order to ensure that
        # there is only one way to point to the same function
        # TODO fix this bug a different way
        # TODO this fails when users make trace statements to the same
        #      function which was re-exported in 2 different paths
        desired_set = [
            {
                "id":
                    trace["id"],
                "function":
                    trace["function"]['name'],
                "statement":
                    trace['statement'],
                "module":
                    convert_relative_import_to_absolute_import(
                        trace['function']['module']['name'],
                        self.package,
                        add_level=True,
                    )
            } for trace in desired_set
        ]

        traces, final_code, errors = self._add_desired_set(desired_set)
        LOGGER.debug('desired_set %s', list(traces.id))

        if errors != {}:
            return errors

        # TODO figure out where to send errors when this fails
        # only after ensuring there are no errors at all do we set code objects
        for (module, function), code in final_code.items():
            function_obj = get_function_in_module(
                self.get_path(module, function),
                self.package,
            )
            function_obj.__code__ = code
        self.traces = traces
        return None

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
