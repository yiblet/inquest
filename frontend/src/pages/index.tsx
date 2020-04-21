import React, { useState } from "react";
import { createApolloClient } from "../utils/apollo_client";
import { ApolloProvider, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { ModulesQuery } from "../generated/ModulesQuery";
import { FileTree } from "../components/file_tree/file_tree";
import { Module } from "../components/file_tree/module";
import dynamic from "next/dynamic";
import { CodeViewConnectorProps } from "../connectors/code_view.connector";

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

// TODO this flickers on changes
export default function Index() {
    const [fileId, setFileId] = useState<string | undefined>(undefined);
    return (
        <ApolloProvider client={createApolloClient()}>
            <div className="flex">
                <FileTreeConnector onPick={setFileId} />
                <CodeViewConnector fileId={fileId} />
            </div>
        </ApolloProvider>
    );
}
