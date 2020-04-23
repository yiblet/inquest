import React, { useState, useEffect } from "react";
import { createApolloClient } from "../utils/apollo_client";
import { ApolloProvider, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { ModulesQuery } from "../generated/ModulesQuery";
import { FileTree } from "../components/file_tree/file_tree";
import { Module } from "../components/file_tree/module";
import dynamic from "next/dynamic";
import { CodeViewConnectorProps } from "../connectors/code_view.connector";
import { LiveTailConnector } from "../connectors/live_tail.connector";

const CodeViewConnector = dynamic<CodeViewConnectorProps>(
    import("../connectors/code_view.connector").then(
        (mod) => mod.CodeViewConnector
    ),
    { ssr: false }
);

const MODULES_QUERY = gql`
    query ModulesQuery {
        rootModules {
            ...ModuleFragment
        }
    }
    ${Module.fragment}
`;

const FileTreeConnector = ({
    onPick,
    currentFileId,
}: {
    currentFileId: string | null;
    onPick: (fileId: string) => void;
}) => {
    const [initalized, setInitialized] = useState(false);
    const { loading, error, data } = useQuery<ModulesQuery>(MODULES_QUERY);
    useEffect(() => {
        if (!initalized && data && data.rootModules.length !== 0) {
            onPick(data.rootModules[0].file.id);
            setInitialized(true);
        }
    }, [initalized, data]);

    if (loading) return <div></div>;
    if (error) throw error;
    if (!data) throw new Error("failed to retrieve data");
    return (
        <div
            style={{
                minWidth: "10rem",
            }}
            className="bg-gray-400 h-screen overflow-y-auto border-r"
        >
            <FileTree
                onPick={onPick}
                modules={data.rootModules}
                currentFileId={currentFileId}
            />
        </div>
    );
};

function withApollo<P>(Comp: React.ComponentType<P>): React.ComponentType<P> {
    return function WithApollo(props: P) {
        return (
            <ApolloProvider client={createApolloClient()}>
                <Comp {...props} />
            </ApolloProvider>
        );
    };
}

function Index() {
    const [fileId, setFileId] = useState<string | null>(null);
    return (
        <div className="flex max-h-screen overflow-none">
            <FileTreeConnector onPick={setFileId} currentFileId={fileId} />
            <div className="w-full">
                <div style={{ height: "50%" }}>
                    <CodeViewConnector fileId={fileId || undefined} />
                </div>
                <div style={{ height: "50%" }}>
                    <LiveTailConnector />
                </div>
            </div>
        </div>
    );
}

export default withApollo(Index);
