import React, { useState } from "react";
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

const BACKGROUND_COLOR = "rgb(232, 232, 232)";

const FileTreeConnector = ({
    onPick,
}: {
    onPick: (fileId: string) => void;
}) => {
    const { loading, error, data } = useQuery<ModulesQuery>(MODULES_QUERY);
    if (loading) return <div></div>;
    if (error) throw error;
    if (!data) throw new Error("failed to retrieve data");
    return (
        <div
            style={{
                minWidth: "10rem",
                backgroundColor: BACKGROUND_COLOR,
                borderColor: "#cebfb6",
            }}
            className="bg-white h-screen overflow-y-auto border-r"
        >
            <FileTree onPick={onPick} modules={data.rootModules} />
        </div>
    );
};

function withApollo<P>(Comp: React.ComponentType<P>): React.ComponentType<P> {
    return (props: P) => (
        <ApolloProvider client={createApolloClient()}>
            <Comp {...props} />
        </ApolloProvider>
    );
}

function TestButton() {
    let [state, setState] = useState(0);
    return (
        <button onClick={(_) => setState((state) => state + 1)}>
            Test Button: {state}
        </button>
    );
}

// TODO this flickers on changes
function Index() {
    const [fileId, setFileId] = useState<string | undefined>(undefined);
    return (
        <div className="flex max-h-screen overflow-none">
            <FileTreeConnector onPick={setFileId} />
            <div className="w-full">
                <div style={{ height: "50%" }}>
                    <CodeViewConnector fileId={fileId} />
                </div>
                <div style={{ height: "50%" }}>
                    <LiveTailConnector />
                </div>
            </div>
        </div>
    );
}

export default withApollo(Index);
