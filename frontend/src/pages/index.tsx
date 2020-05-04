import React, { useState } from "react";
import { createApolloClient } from "../utils/apollo_client";
import { ApolloProvider, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import dynamic from "next/dynamic";
import { CodeViewConnectorProps } from "../connectors/code_view.connector";
import { LiveTailConnector } from "../connectors/live_tail.connector";
import { LiveProbesQuery } from "../generated/LiveProbesQuery";
import { FileFragment } from "../generated/FileFragment";
import { FileTreeConnector } from "../components/file_tree.connector";
import { Resizable } from "re-resizable";

const CodeViewConnector = dynamic<CodeViewConnectorProps>(
    import("../connectors/code_view.connector").then(
        (mod) => mod.CodeViewConnector
    ),
    { ssr: false }
);

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
    const [fileFragment, setFileFragment] = useState<FileFragment | null>(null);
    const [width, setWidth] = useState<number | null>(null);
    return (
        <div className="flex w-full h-screen overflow-none">
            <SideBar>
                <LiveProbesConnector />
                <FileTreeConnector
                    onPick={setFileFragment}
                    currentFile={fileFragment}
                />
            </SideBar>
            <div className="w-full h-full flex overflow-hidden">
                <Resizable
                    onResize={(_e, _direction, _ref, d) => setWidth(d.width)}
                    defaultSize={{
                        width: "50%",
                        height: "100%",
                    }}
                    enable={{ right: true }}
                    maxWidth="70%"
                    minWidth="30%"
                >
                    <CodeViewConnector
                        file={fileFragment || undefined}
                        width={width || undefined}
                    />
                </Resizable>
                <div className="w-full overflow-auto">
                    <LiveTailConnector />
                </div>
            </div>
        </div>
    );
}

export default withApollo(Index);
