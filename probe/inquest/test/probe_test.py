from typing import Dict

import pandas as pd

from inquest.hotpatch import get_function_in_module
from inquest.probe import TRACE_COLUMNS, TRACE_WITH_ERROR_COLUMNS, Probe
from inquest.test.probe_test_module.test_imported_module import sample


def create_trace(module, function, statement, id) -> Dict[str, str]:
    return {
        "module": module,
        "function": function,
        "statement": statement,
        "id": id,
    }


def test_on_function_simple(capsys):
    with Probe(__name__) as probe:
        probe.new_desired_state([
            create_trace(
                '.probe_test_module.test_imported_module',
                'sample',
                '{arg1}',
                "1",
            )
        ])
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "2\n"

    assert sample(2, 1) == 3
    assert capsys.readouterr().out == ""


def test_on_function(capsys):
    with Probe(__name__) as probe:
        probe.new_desired_state([
            create_trace(
                '.probe_test_module.test_imported_module',
                'sample',
                '{arg1}',
                "1",
            )
        ])
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "2\n"

        # testing duplicate
        probe.new_desired_state([
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
        ])
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "2\n1\n"

    assert sample(2, 1) == 3
    assert capsys.readouterr().out == ""


def test_on_function_removal(capsys):
    with Probe(__name__) as probe:
        # testing duplicate
        probe.new_desired_state([
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
        ])
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "2\n1\n"

        probe.new_desired_state([
            create_trace(
                '.probe_test_module.test_imported_module',
                'sample',
                '{arg2}',
                "2",
            )
        ])
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "1\n"

        desired_state = [
            create_trace(
                '.probe_test_module.test_imported_module',
                'sample',
                '{arg2}',
                "3",
            )
        ]
        probe.new_desired_state(desired_state)
        assert sample(2, 1) == 3
        assert all(probe.traces[TRACE_COLUMNS].set_index('id') == pd.DataFrame(
            desired_state).set_index(
                'id')), "traces is not set as the input desired_set"
        assert capsys.readouterr().out == "1\n"

        desired_state = [
            create_trace(
                'inquest.test.probe_test_module.test_imported_module',
                'sample',
                '{arg2} haha',
                "3",
            )
        ]
        probe.new_desired_state(desired_state)
        assert all(probe.traces[TRACE_COLUMNS].set_index('id') == pd.DataFrame(
            desired_state).set_index(
                'id')), "traces is not set as the input desired_set"
        assert capsys.readouterr().out == ""
        assert sample(2, 1) == 3
        assert capsys.readouterr().out == "1 haha\n"

        # probe.new_desired_state([
        #     create_trace(
        #         'inquest.test.probe_test_module.test_imported_module',
        #         'sample',
        #         '{arg2}',
        #         "3",
        #     )
        # ])
        # assert sample(2, 1) == 3
        # assert capsys.readouterr().out == "1\n"

    assert all(
        probe.traces == pd.DataFrame([], columns=TRACE_WITH_ERROR_COLUMNS))
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert capsys.readouterr().out == ""


# def test_imported_module(capsys):
#     with Probe(__name__) as probe:
#         injection = probe.upsert_log('.probe_test_module.test_imported_module',
#                                      'sample', "{arg1}")
#         assert injection.error is None, "injection should succeed"
#         assert injection.enabled, "injection should be enabled"
#         assert injection.module == '.probe_test_module.test_imported_module', "module should be same as put in"
#         assert injection.function == 'sample'
#         assert sample(2, 1) == 3
#         captured = capsys.readouterr()
#         assert capsys.readouterr().out == "2\n"

#     try:
#         injection = probe.upsert_log('.probe_test_module.test_imported_module',
#                                      'sample', "{arg2}")
#     except ValueError:
#         assert False, "upserting a log statement to the same module shouldn't throw"

#     assert sample(2, 3) == 5
#     captured = capsys.readouterr()
#     assert capsys.readouterr().out == "3\n"

#     assert probe.revert_log('.probe_test_module.test_imported_module',
#                             'sample')
#     assert sample(3, 6) == 9
#     captured = capsys.readouterr()
#     assert capsys.readouterr().out == ""
#     assert not probe.revert_log('.probe_test_module.test_imported_module',
#                                 'sample')

# def test_unimported_module(capsys):
#     probe = Probe(__name__)
#     injection = probe.upsert_log('.probe_test_module.test_unimported_module',
#                                  'sample', "{arg1}")
#     from inquest.test.probe_test_module.test_unimported_module import sample
#     assert injection.error is None, "injection should succeed"
#     assert injection.enabled, "injection should be enabled"
#     assert injection.module == '.probe_test_module.test_unimported_module', "module should be same as put in"
#     assert injection.function == 'sample'
#     assert sample(2, 1) == 3
#     captured = capsys.readouterr()
#     assert capsys.readouterr().out == "2\n"

#     try:
#         injection = probe.upsert_log(
#             '.probe_test_module.test_unimported_module', 'sample', "{arg2}")
#     except ValueError:
#         assert False, "upserting a log statement to the same module shouldn't throw"

#     assert sample(2, 3) == 5
#     captured = capsys.readouterr()
#     assert capsys.readouterr().out == "3\n"

#     assert probe.revert_log('.probe_test_module.test_unimported_module',
#                             'sample')
#     assert sample(3, 6) == 9
#     captured = capsys.readouterr()
#     assert capsys.readouterr().out == ""
#     assert not probe.revert_log('.probe_test_module.test_unimported_module',
#                                 'sample')

# def test_modules_resolve_to_different_code_objects(capsys):
#     sample1 = get_function_in_module(
#         '.probe_test_module.test_unimported_module:sample',
#         __name__,
#     )
#     sample2 = get_function_in_module(
#         '.probe_test_module.test_imported_module:sample',
#         __name__,
#     )
#     assert sample1 != sample2, "sample function should be different"
#     assert sample1.__code__ == sample2.__code__, "sample code's should be same"
#     assert id(sample1.__code__) != id(
#         sample2.__code__), "sample code's should be different"
