import "../styles/style.css";
import React, { useState } from "react";
import Link from "next/link";
import { createApolloClient } from "../services/apollo_client";
import { ApolloProvider, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { ModulesQuery } from "../generated/ModulesQuery";
import { FileQuery } from "../generated/FileQuery";
import { FileTree } from "../components/file_tree/file_tree";
import { Module } from "../components/file_tree/module";
import { CodeView } from "../components/code_view/code_view";

const MODULES_QUERY = gql`
    query ModulesQuery {
        rootModules {
            ...ModuleFragment
        }
    }
    ${Module.fragment}
`;

const FILE_QUERY = gql`
    query FileQuery($fileId: String!) {
        file(fileId: $fileId) {
            name
            content
        }
    }
`;

const FileTreeConnector = ({
    onPick,
}: {
    onPick: (fileId: string) => void;
}) => {
    const { loading, error, data } = useQuery<ModulesQuery>(MODULES_QUERY);
    if (loading) return <div></div>;
    if (error) throw error;
    console.log(data);
    return (
        <div
            style={{
                minWidth: "10rem",
                backgroundColor: "#f5f2f0",
                borderColor: "#cebfb6",
            }}
            className="bg-white h-screen overflow-y-auto border-r"
        >
            <FileTree onPick={onPick} modules={data.rootModules} />
        </div>
    );
};

const CodeViewConnector = ({ fileId }: { fileId: string | null }) => {
    const emptyView = (
        <div
            className="w-full h-screen"
            style={{
                backgroundColor: "#f5f2f0",
            }}
        ></div>
    );
    if (!fileId) {
        return emptyView;
    }
    const { loading, error, data } = useQuery<FileQuery>(FILE_QUERY, {
        variables: { fileId },
    });
    if (loading) return emptyView;
    if (error) throw error;
    return (
        <div
            className="w-full overflow-auto"
            style={{
                backgroundColor: "#f5f2f0",
            }}
        >
            <CodeView className="w-full" code={data.file.content} />
        </div>
    );
};

// TODO this flickers on changes
export default function Index() {
    const [fileId, setFileId] = useState<string | null>(null);
    return (
        <ApolloProvider client={createApolloClient()}>
            <div className="flex">
                <FileTreeConnector onPick={setFileId} />
                <CodeViewConnector fileId={fileId} />
            </div>
        </ApolloProvider>
    );
}
