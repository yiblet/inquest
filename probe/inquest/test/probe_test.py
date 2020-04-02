from ..probe import Probe
from .probe_test_module.test_imported_module import sample


def test_imported_module(capsys):
    probe = Probe(__name__)
    injection = probe.add_log('.probe_test_module.test_imported_module',
                              'sample', "{arg1}")
    assert injection.error is None, "injection should succeed"
    assert injection.enabled, "injection should be enabled"
    assert injection.module == '.probe_test_module.test_imported_module', "module should be same as put in"
    assert injection.function == 'sample'
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == "2\n"

    try:
        injection = probe.add_log('.probe_test_module.test_imported_module',
                                  'sample', "{arg2}")
        assert False, "adding a log statement to the same module throw"
    except ValueError:
        pass


def test_unimported_module(capsys):
    probe = Probe(__name__)
    injection = probe.add_log('.probe_test_module.test_unimported_module',
                              'sample', "{arg1}")
    assert injection.error is None, "injection should succeed"
    assert injection.enabled, "injection should be enabled"
    assert injection.module == '.probe_test_module.test_unimported_module', "module should be same as put in"
    assert injection.function == 'sample'
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == "2\n"

    try:
        injection = probe.add_log('.probe_test_module.test_unimported_module',
                                  'sample', "{arg2}")
        assert False, "adding a log statement to the same module throw"
    except ValueError:
        pass
