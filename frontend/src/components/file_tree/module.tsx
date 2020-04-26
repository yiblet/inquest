import React from "react";
import gql from "graphql-tag";
import { DirectoryFragment } from "../../generated/DirectoryFragment";
import { FileFragment } from "../../generated/FileFragment";
import { SubdirectoryFragment } from "../../generated/SubdirectoryFragment";

export const FILE_FRAGMENT = gql`
    fragment FileFragment on FileInfo {
        id
        name
        classes {
            name
        }
        functions {
            name
        }
    }
`;

export type ModuleProps = {
    file: React.ComponentType<{ fragment: FileFragment }>;
    subdirectory: React.ComponentType<{ fragment: SubdirectoryFragment }>;
    fragment: DirectoryFragment;
};

export function Module(props: ModuleProps) {
    return (
        <div className="pl-2">
            {props.fragment.subDirectories.map((subdirectory) => (
                <props.subdirectory
                    fragment={subdirectory}
                    key={subdirectory.id}
                />
            ))}
            {props.fragment.files.map((file) => (
                <props.file fragment={file} key={file.id} />
            ))}
        </div>
    );
}

export const SUBDIRECTORY_FRAGMENT = gql`
    fragment SubdirectoryFragment on DirectoryInfo {
        id
        name
    }
`;

export const DIRECTORY_FRAGMENT = gql`
    fragment DirectoryFragment on DirectoryInfo {
        subDirectories {
            id
            name
        }
        files {
            ...FileFragment
        }
    }
    ${FILE_FRAGMENT}
`;
