from typing import Dict

import pandas as pd

from inquest.hotpatch import convert_relative_import_to_absolute_import
from inquest.probe import TRACE_COLUMNS, TRACE_WITH_ERROR_COLUMNS, Probe
from inquest.test.probe_test_module.test_imported_module import sample


def flatten_trace(trace):
    return {
        "module": trace['function']['module']['name'],
        "function": trace['function']['name'],
        "statement": trace['statement'],
        "id": trace['id'],
    }


def create_trace(module, function, statement, id) -> Dict[str, str]:
    return {
        "function": {
            "name": function,
            "module": {
                "name": module,
            }
        },
        "statement": statement,
        "id": id,
    }


def test_on_function_simple(capsys):
    with Probe(__name__) as probe:
        result = probe.new_desired_state(
            [
                create_trace(
                    '.probe_test_module.test_imported_module',
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
    with Probe(__name__) as probe:
        result = probe.new_desired_state(
            [
                create_trace(
                    '.probe_test_module.test_imported_module',
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
                    '.probe_test_module.test_imported_module',
                    'sample',
                    '{arg1}',
                    "1",
                ),
                create_trace(
                    '.probe_test_module.test_imported_module',
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
    with Probe(__name__) as probe:

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
                    '.probe_test_module.test_imported_module',
                    'sample',
                    '{arg1}',
                    "1",
                ),
                create_trace(
                    '.probe_test_module.test_imported_module',
                    'sample',
                    '{arg2}',
                    "2",
                )
            ], "2\n1"
        )

        assert_desired_state(
            [
                create_trace(
                    '.probe_test_module.test_imported_module',
                    'sample',
                    '{arg2}',
                    "2",
                )
            ], "1"
        )

        assert_desired_state(
            [
                create_trace(
                    '.probe_test_module.test_imported_module',
                    'sample',
                    '{arg2}',
                    "3",
                )
            ], "1"
        )

        assert_desired_state(
            [
                create_trace(
                    'inquest.test.probe_test_module.test_imported_module',
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
                    'inquest.test.probe_test_module.test_imported_module',
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


def test_failed_imports(capsys):
    with Probe(__name__) as probe:

        def assert_modules(modules, failures):
            result = probe.new_desired_state(
                [
                    create_trace(
                        module,
                        'sample',
                        '{arg1}',
                        "1",
                    ) for module in modules
                ]
            )
            for module in failures:
                assert (
                    convert_relative_import_to_absolute_import(
                        module,
                        __name__,
                        add_level=True,
                    ), 'sample'
                ) in result
            assert sample(2, 1) == 3
            assert capsys.readouterr().out == ""

        # testing duplicate
        assert_modules(
            [
                '.probe_test_module.x',
            ],
            [
                '.probe_test_module.x',
            ],
        )
        assert_modules(
            [
                '.probe_test_module.x',
                '.probe_test_module.test_imported_module',
            ],
            [
                '.probe_test_module.x',
            ],
        )
        assert_modules(
            [
                '.probe_test_module.x',
                '.probe_test_module.y',
            ],
            [
                '.probe_test_module.x',
                '.probe_test_module.y',
            ],
        )
        assert_modules(
            [
                'arbitrary.absolute.import',
                '.probe_test_module.y',
            ], [
                'arbitrary.absolute.import',
                '.probe_test_module.y',
            ]
        )


def test_failed_strings(capsys):
    with Probe(__name__) as probe:

        def make_assertions(modules, failures):
            result = probe.new_desired_state(
                [
                    create_trace(
                        module,
                        'sample',
                        statement,
                        "1",
                    ) for module, statement in modules
                ]
            )
            for module in failures:
                assert (
                    convert_relative_import_to_absolute_import(
                        module,
                        __name__,
                        add_level=True,
                    ), 'sample'
                ) in result
            assert sample(2, 1) == 3
            assert capsys.readouterr().out == ""

        # testing duplicate
        make_assertions(
            [
                ('.probe_test_module.test_imported_module', '{arg3}'),
            ],
            [
                '.probe_test_module.test_imported_module',
            ],
        )

        make_assertions(
            [
                ('.probe_test_module.test_imported_module', '{'),
            ],
            [
                '.probe_test_module.test_imported_module',
            ],
        )
        make_assertions(
            [
                ('.probe_test_module.test_imported_module', '{arg1 + 2}'),
            ],
            [
                '.probe_test_module.test_imported_module',
            ],
        )
