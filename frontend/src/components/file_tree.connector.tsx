import React, { useCallback } from "react";
import { gql, useQuery } from "@apollo/client";
import { Module, DIRECTORY_FRAGMENT } from "./file_tree/module";
import { FileFragment } from "../generated/FileFragment";
import { useEffect, useState } from "react";
import { SubdirectoryQuery } from "../generated/SubdirectoryQuery";
import { FileTree, Line } from "./file_tree/file_tree";
import { SubdirectoryFragment } from "../generated/SubdirectoryFragment";
import { ImmSet } from "../utils/collections";
import { FileTreeFragment } from "../generated/FileTreeFragment";

export const FILE_TREE_FRAGMENT = gql`
    fragment FileTreeFragment on TraceSet {
        rootDirectory {
            ...DirectoryFragment
        }
    }
    ${DIRECTORY_FRAGMENT}
`;

const SUBDIRECTORY_QUERY = gql`
    query SubdirectoryQuery($directoryId: String!) {
        directory(directoryId: $directoryId) {
            ...DirectoryFragment
        }
    }
    ${DIRECTORY_FRAGMENT}
`;

export const SubdirectoryHOC = ({
    file,
    isVisible,
    toggle,
}: {
    isVisible: (id: string) => boolean;
    toggle: (id: string) => any;
    file: React.ComponentType<{ fragment: FileFragment }>;
}) => {
    const Subdirectory: React.FC<{ fragment: SubdirectoryFragment }> = ({
        fragment,
    }) => {
        return (
            <>
                <Line
                    text={fragment.name}
                    onClick={(_) => toggle(fragment.id)}
                />
                {isVisible(fragment.id) ? (
                    <SubdirectoryLoader fragment={fragment} />
                ) : (
                    <></>
                )}
            </>
        );
    };

    const SubdirectoryLoader = ({
        fragment,
    }: {
        fragment: SubdirectoryFragment;
    }) => {
        const { loading, error, data } = useQuery<SubdirectoryQuery>(
            SUBDIRECTORY_QUERY,
            { variables: { directoryId: fragment.id } }
        );
        if (loading) return <Line text={fragment.name + " loading..."} />;
        if (error) throw error;
        if (!data || !data.directory)
            throw new Error("failed to retrieve data");
        return (
            <Module
                file={file}
                subdirectory={Subdirectory}
                fragment={data.directory}
            />
        );
    };

    return Subdirectory;
};

type FileTreeConnectorProps = {
    fileTree: FileTreeFragment;
    currentFile: FileFragment | null;
    onPick: (fileFragment: FileFragment) => void;
};

export const FileHOC = ({
    onPick,
    currentFile,
}: FileTreeConnectorProps): React.FC<{ fragment: FileFragment }> => {
    const FileLine = ({ fragment }: { fragment: FileFragment }) => (
        <Line
            highlight={fragment.id == currentFile?.id}
            text={fragment.name.substring(fragment.name.lastIndexOf("/") + 1)}
            onClick={(_) => onPick && onPick(fragment)}
        />
    );
    return FileLine;
};

export const FileTreeConnector = (props: FileTreeConnectorProps) => {
    const { onPick } = props;
    const [initalized, setInitialized] = useState(false);
    // FIXME move this state down to the actual FileTree
    const [visibleSubdirs, setVisibleSubdirs] = useState<ImmSet<string>>(
        ImmSet()
    );
    const data = props.fileTree;
    useEffect(() => {
        if (!initalized && data && data.rootDirectory.files.length !== 0) {
            onPick(data.rootDirectory.files[0]);
            setInitialized(true);
        }
    }, [initalized, data]);
    const File = useCallback(FileHOC(props), [
        FileHOC,
        props.onPick,
        props.currentFile,
    ]);
    const Subdirectory = useCallback(
        SubdirectoryHOC({
            file: File,
            isVisible: (id) => visibleSubdirs.has(id),
            toggle: (id) =>
                setVisibleSubdirs((visibleSubdirs) => {
                    if (visibleSubdirs.has(id)) {
                        return visibleSubdirs.remove(id);
                    }
                    return visibleSubdirs.add(id);
                }),
        }),
        [SubdirectoryHOC, setVisibleSubdirs, visibleSubdirs, File]
    );

    return (
        <FileTree
            file={File}
            subdirectory={Subdirectory}
            fragment={data.rootDirectory}
        />
    );
};
