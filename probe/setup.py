import pathlib
import re

from setuptools import setup

REGEX = re.compile(r'^[\w-]*(==\w*\s*)?$')

REQUIREMENTS = [
    statement
    for statement in pathlib.Path('requirements.txt').open().readlines()
    if REGEX.match(statement)
]

print(REQUIREMENTS)

setup(
    name='inquest',
    version='0.0.1',
    description='the inquest logger',
    author='Shalom Yiblet',
    author_email='shalom.yiblet@gmail.com',
    install_requires=REQUIREMENTS + ['gql'],
    dependency_links=[
        'http://github.com/leszekhanusz/gql/tarball/ada2d6ce50388a714fe9cbea89f5f642e0e5f2e0#egg=gql-0.4.0'
    ],
    packages=['inquest'],
)
