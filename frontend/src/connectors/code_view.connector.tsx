import React from "react";
import gql from "graphql-tag";
import { CodeView, CodeViewProps } from "../components/code_view/code_view";
import { CodeViewQuery } from "../generated/CodeViewQuery";
import { useQuery, useMutation } from "@apollo/client";
import { ExistingTrace } from "../components/code_view/utils";
import { PropsOf } from "../utils/types";
import { config } from "../config";
import { NewTraceMutation } from "../generated/NewTraceMutation";
import { UpdateTraceMutation } from "../generated/UpdateTraceMutation";
import { DeleteTraceMutation } from "../generated/DeleteTraceMutation";
import { createLogger } from "../utils/logger";
import { FileFragment } from "../generated/FileFragment";
import { FunctionFragment } from "../generated/FunctionFragment";

const logger = createLogger(["CodeViewConnector"]);

const TRACE_FRAGMENT = gql`
    fragment TraceFragment on Trace {
        id
        statement
        active
        version
        currentFailures {
            message
        }
    }
`;

const FUNCTION_FRAGMENT = gql`
    fragment FunctionFragment on FunctionInfo {
        id
        line
        name
        traces {
            ...TraceFragment
        }
    }

    ${TRACE_FRAGMENT}
`;

const CODE_VIEW_FRAGMENT = gql`
    fragment CodeViewFragment on FileInfo {
        id
        name
        content
        functions {
            ...FunctionFragment
        }
        classes {
            id
            line
            name
            methods {
                ...FunctionFragment
            }
        }
    }

    ${FUNCTION_FRAGMENT}
`;

const CODE_VIEW_QUERY = gql`
    query CodeViewQuery($fileId: String!) {
        file(fileId: $fileId) {
            ...CodeViewFragment
        }
    }
    ${CODE_VIEW_FRAGMENT}
`;

const NEW_TRACE = gql`
    mutation NewTraceMutation(
        $functionId: String!
        $statement: String!
        $key: String!
    ) {
        newTrace(
            newTraceInput: {
                functionId: $functionId
                statement: $statement
                traceSetKey: $key
            }
        ) {
            ...TraceFragment
        }
    }
    ${TRACE_FRAGMENT}
`;

const UPDATE_TRACE = gql`
    mutation UpdateTraceMutation(
        $active: Boolean
        $statement: String
        $id: String!
    ) {
        updateTrace(
            updateTraceInput: {
                statement: $statement
                active: $active
                id: $id
            }
        ) {
            ...TraceFragment
        }
    }
    ${TRACE_FRAGMENT}
`;

const DELETE_TRACE = gql`
    mutation DeleteTraceMutation($id: String!) {
        deleteTrace(traceId: $id) {
            id
        }
    }
`;

/**
 * CodeViewConnector maps data from the graphql queries and mutations back into the CodeView
 */
export const CodeViewConnector = ({ file }: { file?: FileFragment }) => {
    const emptyView = (
        <div
            className="w-full h-screen"
            style={{
                backgroundColor: "white",
            }}
        ></div>
    );
    if (!file) {
        return emptyView;
    }
    const { loading, error, data, refetch } = useQuery<CodeViewQuery>(
        CODE_VIEW_QUERY,
        {
            variables: { fileId: file.id },
            pollInterval: 2000,
        }
    );

    const [newTrace] = useMutation<NewTraceMutation>(NEW_TRACE);
    const [updateTrace] = useMutation<UpdateTraceMutation>(UPDATE_TRACE);
    const [deleteTrace] = useMutation<DeleteTraceMutation>(DELETE_TRACE);

    logger.debug("rerender");

    if (loading) return emptyView;
    if (error) throw error;
    if (!data || !data.file)
        throw new Error("failed to retrieve file information");

    const props: CodeViewProps = {
        fragment: data.file,
        onCreate: async (func: FunctionFragment, traceStatement) => {
            logger.debug("on create was called");
            const result = await newTrace({
                variables: {
                    functionId: func.id,
                    statement: traceStatement,
                    key: config.traceSet,
                },
            });
            await refetch();
            if (result.errors) throw result.errors;
        },
        onEdit: async (trace: ExistingTrace, traceStatement) => {
            logger.debug("on delete was called");
            const update = await updateTrace({
                variables: {
                    statement: traceStatement,
                    id: trace.id,
                },
            });
            if (update.errors) throw update.errors;
        },
        onDelete: async (trace: ExistingTrace) => {
            logger.debug("on delete was called");
            await deleteTrace({
                variables: {
                    id: trace.id,
                },
            });
            await refetch();
        },
    };

    return <CodeView {...props} />;
};

export type CodeViewConnectorProps = PropsOf<typeof CodeViewConnector>;
