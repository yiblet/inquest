#!/usr/bin/env python3

import argparse
import glob
import os


def camel(snake_str: str):
    first, *others = snake_str.split('_')
    return ''.join([first.title(), *map(str.title, others)])


def main():
    parser = argparse.ArgumentParser('gen_entities')
    parser.add_argument(
        'entities',
        type=str,
        help="location of the entity directory (usually src/entities)")

    args = parser.parse_args()
    entities: str = args.entities
    files = [
        file[len(entities):]
        for file in sorted(glob.glob(f'{entities}/**/*.ts', recursive=True)) if
        '__tests__' not in file and 'test' not in file and 'index' not in file
    ]

    print("// AUTOGENERATED FROM scripts/make_entities.py DO NOT MODIFY")
    for file in files:
        basename = os.path.basename(file)
        print(f'import {{ {camel(basename[:-3])} }} from ".{file[:-3]}";')

    print("")
    print('export const ALL_ENTITIES = [')
    for file in files:
        basename = os.path.basename(file)
        print(f'    {camel(basename[:-3])},')
    print(f'    // placeholder to prevent prettier from' +
          ' turning array into one line')
    print('];')


if __name__ == "__main__":
    main()