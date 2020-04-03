import pathlib
from setuptools import setup

REQUIREMENTS = pathlib.Path('requirements.txt').open().readlines()

setup(
    name='inquest',
    version='0.0.1',
    description='the inquest logger',
    author='Shalom Yiblet',
    author_email='shalom.yiblet@gmail.com',
    # TODO make this more robust to changes in the requirements.txt
    install_requires=REQUIREMENTS[:-1],
    dependency_links=REQUIREMENTS[-1:],
    packages=['inquest'],
)
