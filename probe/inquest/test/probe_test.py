from inquest.hotpatch import get_function_in_module
from inquest.probe import Probe
from inquest.test.probe_test_module.test_imported_module import sample


def test_imported_module(capsys):
    probe = Probe(__name__)
    injection = probe.upsert_log('.probe_test_module.test_imported_module',
                                 'sample', "{arg1}")
    assert injection.error is None, "injection should succeed"
    assert injection.enabled, "injection should be enabled"
    assert injection.module == '.probe_test_module.test_imported_module', "module should be same as put in"
    assert injection.function == 'sample'
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == "2\n"

    try:
        injection = probe.upsert_log('.probe_test_module.test_imported_module',
                                     'sample', "{arg2}")
    except ValueError:
        assert False, "upserting a log statement to the same module shouldn't throw"

    assert sample(2, 3) == 5
    captured = capsys.readouterr()
    assert captured.out == "3\n"

    assert probe.revert_log('.probe_test_module.test_imported_module',
                            'sample')
    assert sample(3, 6) == 9
    captured = capsys.readouterr()
    assert captured.out == ""
    assert not probe.revert_log('.probe_test_module.test_imported_module',
                                'sample')


def test_unimported_module(capsys):
    probe = Probe(__name__)
    injection = probe.upsert_log('.probe_test_module.test_unimported_module',
                                 'sample', "{arg1}")
    from inquest.test.probe_test_module.test_unimported_module import sample
    assert injection.error is None, "injection should succeed"
    assert injection.enabled, "injection should be enabled"
    assert injection.module == '.probe_test_module.test_unimported_module', "module should be same as put in"
    assert injection.function == 'sample'
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == "2\n"

    try:
        injection = probe.upsert_log(
            '.probe_test_module.test_unimported_module', 'sample', "{arg2}")
    except ValueError:
        assert False, "upserting a log statement to the same module shouldn't throw"

    assert sample(2, 3) == 5
    captured = capsys.readouterr()
    assert captured.out == "3\n"

    assert probe.revert_log('.probe_test_module.test_unimported_module',
                            'sample')
    assert sample(3, 6) == 9
    captured = capsys.readouterr()
    assert captured.out == ""
    assert not probe.revert_log('.probe_test_module.test_unimported_module',
                                'sample')


def test_modules_resolve_to_different_code_objects(capsys):
    sample1 = get_function_in_module(
        '.probe_test_module.test_unimported_module:sample',
        __name__,
    )
    sample2 = get_function_in_module(
        '.probe_test_module.test_imported_module:sample',
        __name__,
    )
    assert sample1 != sample2, "sample function should be different"
    assert sample1.__code__ == sample2.__code__, "sample code's should be same"
    assert id(sample1.__code__) != id(
        sample2.__code__), "sample code's should be different"
