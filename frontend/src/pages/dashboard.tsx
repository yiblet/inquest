import React, { useState, useEffect, useContext, useCallback } from "react";
import { createApolloClient } from "../utils/apollo_client";
import { ApolloProvider, useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import dynamic from "next/dynamic";
import { CodeViewConnectorProps } from "../connectors/code_view.connector";
import { LiveTailConnector } from "../connectors/live_tail.connector";
import { FileFragment } from "../generated/FileFragment";
import {
    FileTreeConnector,
    FILE_TREE_FRAGMENT,
} from "../components/file_tree.connector";
import { Resizable } from "re-resizable";
import { getToken, logout, useEnsureLoggedIn } from "../utils/auth";
import { UserContextQuery } from "../generated/UserContextQuery";
import { copyToClipboard } from "../utils/clipboard_copy";
import { LiveProbesFragment } from "../generated/LiveProbesFragment";
import ms from "ms";
import {
    faSignOutAlt,
    faPaste,
    faArrowLeft,
    faTrash,
    faBook,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { RemoveRootDirectoryMutation } from "../generated/RemoveRootDirectoryMutation";
import { getDocsURL } from "../utils/protocol";
import { useNotifications } from "../components/utils/notifications";
import { getPublicRuntimeConfig } from "../config";
import Skeleton from "react-loading-skeleton";

// TODO refactor this file into multiple files

const CodeViewSkeleton = () => (
    <div className="h-full max-w-xl px-4 py-10">
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton width="50%" />
        <br />
        <br />
        <br />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton width="50%" />
    </div>
);

const CodeViewConnector = dynamic<CodeViewConnectorProps>(
    import("../connectors/code_view.connector").then(
        (mod) => mod.CodeViewConnector
    ),
    {
        ssr: false,
        loading: CodeViewSkeleton,
    }
);

const LIVE_PROBES_FRAGMENT = gql`
    fragment LiveProbesFragment on TraceSet {
        id
        liveProbes {
            id
        }
    }
`;

const USER_CONTEXT_QUERY = gql`
    query UserContextQuery {
        me {
            organization {
                traceSets {
                    id
                    ...LiveProbesFragment
                    ...FileTreeFragment
                }
            }
        }
    }

    ${LIVE_PROBES_FRAGMENT}
    ${FILE_TREE_FRAGMENT}
`;

const REMOVE_ROOT_DIRECTORY = gql`
    mutation RemoveRootDirectoryMutation {
        removeRootDirectory
    }
`;

const SideBar: React.FC<{}> = ({ children }) => {
    return (
        <div
            style={{
                minWidth: "15rem",
            }}
            className="p-1 bg-gray-300 h-screen overflow-y-auto border-r shadow-lg"
        >
            {children}
        </div>
    );
};

function withApollo<P>(Comp: React.ComponentType<P>): React.ComponentType<P> {
    return function WithApollo(props: P) {
        useEnsureLoggedIn();
        const token = getToken();
        return (
            <ApolloProvider client={createApolloClient(token)}>
                <Comp {...props} />
            </ApolloProvider>
        );
    };
}

const UserInfo: React.FC<LiveProbesFragment & { clearFiles: () => any }> = ({
    id,
    liveProbes,
    clearFiles,
}) => {
    const notifications = useNotifications();
    const numProbes = liveProbes?.length || 0;
    const [removeRootDirectory] = useMutation<RemoveRootDirectoryMutation>(
        REMOVE_ROOT_DIRECTORY
    );
    const docsURL = getDocsURL();
    return (
        <div className="mb-4">
            <div className="pl-2 text-md mb-2 font-semibold text-gray-800">
                User
            </div>
            <Link href="/">
                <a href="/">
                    <div className="pl-4 mb-w border rounded py-1 px-2 hover:bg-gray-400 cursor-pointer">
                        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />{" "}
                        home
                    </div>
                </a>
            </Link>
            <div
                className="pl-4 mb-w border rounded py-1 px-2 hover:bg-gray-400 cursor-pointer"
                onClick={(_) => logout()}
            >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> logout
            </div>
            <div
                className="pl-4 mb-1 border rounded py-1 px-2 hover:bg-gray-400 cursor-pointer"
                onClick={(_) => {
                    copyToClipboard(id);
                    notifications.notify("api key was copied to clipboard");
                }}
            >
                <FontAwesomeIcon icon={faPaste} className="mr-2" /> copy api key
            </div>
            <a href={docsURL + "/docs/overview"}>
                <div className="pl-4 mb-w border rounded py-1 px-2 hover:bg-gray-400 cursor-pointer">
                    <FontAwesomeIcon icon={faBook} className="mr-2" /> docs
                </div>
            </a>
            <div
                className="pl-4 mb-w border rounded py-1 px-2 hover:bg-gray-400 cursor-pointer"
                onClick={async (_) => {
                    notifications.notify(
                        "clearing all modules, in order to create new ones restart your python probe"
                    );
                    await removeRootDirectory();
                    await clearFiles();
                }}
            >
                <FontAwesomeIcon icon={faTrash} className="mr-2" /> clear all
                modules
            </div>
            <div className="pl-4 mb-1 border rounded py-1 px-2 text-gray-700">
                <b>{numProbes}</b> instance
                {numProbes === 1 ? "" : "s"} connected
            </div>
        </div>
    );
};

const WelcomeMessage: React.FC = () => {
    const { docsEndpoint } = getPublicRuntimeConfig();
    let route = "/docs";
    if (docsEndpoint !== "docs.inquest.dev") {
        route = "/docs/getting_started_with_docker";
    }
    return (
        <div className="px-8 py-4 article max-w-xl">
            <h2>Welcome To The Dashboard!</h2>
            <p>
                In order to get started make sure you have a python instance
                connected with Inquest.{" "}
                <a href={getDocsURL() + route}>
                    {" "}
                    Follow this documentation to learn more.
                </a>
            </p>

            <h3> What's Next?</h3>
            <p>
                You should see that you now have 1 python instance connected. If
                that's the case you're all set. If you've passed in files in the{" "}
                <code>{"glob"}</code> keyword, you'll be able to open them up
                under modules in the sidebar.
            </p>
            <p>
                Open a file, click on a line inside of a function and see the
                magic!
            </p>
            <video width={570} height={398} autoPlay loop>
                <source
                    src="/resources/inquest_logging_video.webm"
                    type="video/webm"
                />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

function Dashboard() {
    const { loading, error, data, refetch } = useQuery<UserContextQuery>(
        USER_CONTEXT_QUERY,
        {
            pollInterval: ms("5s"),
        }
    );
    const [fileFragment, setFileFragment] = useState<FileFragment | null>(null);
    const clearFileFragment = useCallback(async () => {
        setFileFragment(null), await refetch();
    }, [refetch, setFileFragment]);

    const [width, setWidth] = useState<number | null>(null);
    useEffect(() => {
        if (error) {
            console.warn("logging out because of error", error);
            logout();
        }
        if (!loading && !data?.me?.organization.traceSets[0]) {
            console.warn("logging out because of data", data);
            logout();
        }
    }, [error, data]);

    if (loading) return <div></div>;

    if (error) {
        if (error.message === "Network error: invalid user id") {
            return <></>;
        }
        logout();
        throw error;
    }

    const traceSet = data?.me?.organization.traceSets[0];
    if (!traceSet) {
        return <></>;
    }

    return (
        <div className="flex w-full h-screen overflow-none">
            <SideBar>
                <UserInfo {...traceSet} clearFiles={clearFileFragment} />
                <FileTreeConnector
                    fileTree={traceSet}
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
                    {!fileFragment ? (
                        <WelcomeMessage />
                    ) : (
                        <CodeViewConnector
                            file={fileFragment}
                            width={width || undefined}
                            traceSetId={traceSet.id}
                        />
                    )}
                </Resizable>
                <div className="w-full overflow-auto">
                    <LiveTailConnector traceSetId={traceSet.id} />
                </div>
            </div>
        </div>
    );
}

export default withApollo<{}>(Dashboard);
