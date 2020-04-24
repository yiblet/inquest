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
import { LiveProbesQuery } from "../generated/LiveProbesQuery";

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

const LIVE_PROBES_QUERY = gql`
    query LiveProbesQuery {
        liveProbes {
            key
        }
    }
`;

const LiveProbesConnector: React.FC = () => {
    const { loading, error, data } = useQuery<LiveProbesQuery>(
        LIVE_PROBES_QUERY,
        { pollInterval: 10 * 1000 }
    );
    if (loading) return <div></div>;
    if (error) throw error;
    if (!data) throw new Error("failed to retrieve data");
    const numProbes = data.liveProbes?.length || 0;

    const message =
        numProbes === 0
            ? "No Probes"
            : `${numProbes} Probe${numProbes == 1 ? "" : "s"}`;

    return (
        <div className="text-md mb-4 font-semibold text-gray-800">
            {message}
        </div>
    );
};

const SideBar: React.FC<{}> = ({ children }) => {
    return (
        <div
            style={{
                minWidth: "10rem",
            }}
            className="p-1 bg-gray-400 h-screen overflow-y-auto border-r"
        >
            {children}
        </div>
    );
};

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
        <FileTree
            onPick={onPick}
            modules={data.rootModules}
            currentFileId={currentFileId}
        />
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
        <div className="flex h-screen overflow-none">
            <SideBar>
                <LiveProbesConnector />
                <FileTreeConnector onPick={setFileId} currentFileId={fileId} />
            </SideBar>
            <div className="w-full h-full grid grid-cols-2">
                <div>
                    <CodeViewConnector fileId={fileId || undefined} />
                </div>
                <div className="overflow-auto">
                    <LiveTailConnector />
                </div>
            </div>
        </div>
    );
}

export default withApollo(Index);
