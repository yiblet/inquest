from ..hotpatch import embed_in_function
from .embed_test_module.test_imported_module import (SampleChildClass,
                                                     SampleClass, sample)


def test_imported_module(capsys):
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == ""
    embed_in_function('.embed_test_module.test_imported_module:sample',
                      "{arg1}")
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == "2\n"

    sampleObject = SampleClass()
    sampleChildObject = SampleChildClass()

    assert sampleObject.sample_method(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == ""
    assert sampleChildObject.sample_method(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == ""

    embed_in_function(
        '.embed_test_module.test_imported_module:SampleClass.sample_method',
        "{arg1}")
    assert sampleObject.sample_method(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == "2\n"
    assert sampleChildObject.sample_method(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == "2\n"


def test_unimported_module(capsys):
    embed_in_function('.embed_test_module.test_unimported_module:sample',
                      "{arg1}")
    # pylint: disable=all
    from .embed_test_module.test_unimported_module import sample
    assert sample(2, 1) == 3
    captured = capsys.readouterr()
    assert captured.out == "2\n"
