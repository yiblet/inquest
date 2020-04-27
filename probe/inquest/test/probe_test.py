import os
from typing import Dict

import pandas as pd

from inquest.hotpatch import convert_relative_import_to_absolute_import
from inquest.probe import TRACE_COLUMNS, TRACE_WITH_ERROR_COLUMNS, Probe
from inquest.test.probe_test_module.test_imported_module import sample
from inquest.test.sample import TestClass


def flatten_trace(trace):
    return {
        "module": trace['function']['file']['name'],
        "function": trace['function']['name'],
        "statement": trace['statement'],
        "id": trace['id'],
    }


def create_trace(file, function, statement, id, cls=None) -> Dict[str, str]:
    return {
        "function":
            {
                "name": function,
                "file": {
                    "name": file,
                },
                'parentClass': {
                    'name': cls
                } if cls is not None else None
            },
        "statement": statement,
        "id": id,
    }


def test_on_function_simple(capsys):
    with Probe(os.path.abspath(os.path.dirname(__file__) + "/../.."),
               __name__) as probe:
        result = probe.new_desired_state(
            [
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg1}',
                    "1",
                )
            ]
        )
        assert result is None
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "2\n"

    assert sample(2, 1) == 3
    assert capsys.readouterr().out == ""


def test_on_function(capsys):
    with Probe(os.path.abspath(os.path.dirname(__file__) + "/../.."),
               __name__) as probe:
        result = probe.new_desired_state(
            [
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg1}',
                    "1",
                )
            ]
        )
        assert result is None
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "2\n"

        # testing duplicate
        result = probe.new_desired_state(
            [
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg1}',
                    "1",
                ),
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg2}',
                    "2",
                )
            ]
        )
        assert result is None
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "2\n1\n"

    assert sample(2, 1) == 3
    assert capsys.readouterr().out == ""


def test_on_function_changes(capsys):
    with Probe(os.path.abspath(os.path.dirname(__file__) + "/../.."),
               __name__) as probe:

        def assert_desired_state(desired_state, output):
            result = probe.new_desired_state(desired_state)
            assert result is None
            assert capsys.readouterr().out == ""
            assert sample(2, 1) == 3
            traces = probe.traces[TRACE_COLUMNS].set_index('id')
            assert all(
                traces == pd
                .DataFrame([flatten_trace(trace)
                            for trace in desired_state]).set_index('id')
            ), "traces is not set as the input desired_set"
            assert capsys.readouterr().out == f"{output}\n"

        # testing duplicate
        assert_desired_state(
            [
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg1}',
                    "1",
                ),
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg2}',
                    "2",
                )
            ], "2\n1"
        )

        assert_desired_state(
            [
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg2}',
                    "2",
                )
            ], "1"
        )

        assert_desired_state(
            [
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg2}',
                    "3",
                )
            ], "1"
        )

        assert_desired_state(
            [
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg2} haha',
                    "3",
                )
            ],
            "1 haha",
        )

        assert_desired_state(
            [
                create_trace(
                    'inquest/test/probe_test_module/test_imported_module.py',
                    'sample',
                    '{arg2}',
                    "3",
                )
            ],
            "1",
        )

    assert all(
        probe.traces == pd.DataFrame([], columns=TRACE_WITH_ERROR_COLUMNS)
    )
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert capsys.readouterr().out == ""


def test_on_class_methods(capsys):
    with Probe(os.path.abspath(os.path.dirname(__file__) + "/../.."),
               __name__) as probe:

        def assert_desired_state(desired_state, output):
            result = probe.new_desired_state(desired_state)
            obj = TestClass()
            assert result is None
            assert capsys.readouterr().out == ""
            obj.sample(2)
            traces = probe.traces[TRACE_COLUMNS].set_index('id')
            assert all(
                traces == pd
                .DataFrame([flatten_trace(trace)
                            for trace in desired_state]).set_index('id')
            ), "traces is not set as the input desired_set"
            assert capsys.readouterr().out == f"{output}\n"

        assert_desired_state(
            [
                create_trace(
                    'inquest/test/sample.py', 'sample', '{x}', "3", 'TestClass'
                )
            ],
            "2",
        )
