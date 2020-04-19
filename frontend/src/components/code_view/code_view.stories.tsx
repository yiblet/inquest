import React from "react";
import { CodeView } from "./code_view";
import { Floater } from "./floater";

export default { title: "stories" };

const CODE = `
import pathlib
import re

from setuptools import setup

REGEX = re.compile(r'^[\\w-]*(==\\w*\\s*)?$')

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
`;

export const TestCodeBlock = () => {
    return (
        <div style={{ width: 500, height: 500 }}>
            <CodeView code={CODE} />
        </div>
    );
};

export const TestFloater = () => {
    return (
        <div className="relative" style={{ width: 500, height: 500 }}>
            <Floater position={{ left: 200, top: 5 }}>
                <div className="w-20 h-20 bg-black"></div>
            </Floater>
        </div>
    );
};
