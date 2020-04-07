from inquest.hotpatch import convert_relative_import_to_absolute_import

# TODO test if this works for relative imports relative to __main__


def test_absolutize():
    assert convert_relative_import_to_absolute_import(
        '.',
        'package',
    ) == 'package'

    assert convert_relative_import_to_absolute_import(
        '.module',
        'package',
    ) == 'package.module'

    assert convert_relative_import_to_absolute_import(
        '..module',
        'package.subpackage',
    ) == 'package.module'

    assert convert_relative_import_to_absolute_import(
        '..',
        'package.subpackage',
    ) == 'package'

    assert convert_relative_import_to_absolute_import(
        '..module.submodule',
        'package.subpackage',
    ) == 'package.module.submodule'
