import pathlib
from distutils.core import setup

import pkg_resources

with pathlib.Path('requirements.txt').open() as requirements_txt:
    REQUIREMENTS = [
        str(requirement)
        for requirement in pkg_resources.parse_requirements(requirements_txt)
    ]

setup(
    name='inquest',
    version='0.0.1',
    description='the inquest logger',
    author='Shalom Yiblet',
    author_email='shalom.yiblet@gmail.com',
    install_requires=REQUIREMENTS,
    packages=['inquest'],
)
