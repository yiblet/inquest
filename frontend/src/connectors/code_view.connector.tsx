import React from "react";
import gql from "graphql-tag";
import { CodeView, CodeViewProps } from "../components/code_view/code_view";
import { CodeViewQuery } from "../generated/CodeViewQuery";
import { useQuery, useMutation } from "@apollo/client";
import { ExistingTrace } from "../components/code_view/utils";
import { PropsOf } from "../utils/types";
import { getPublicRuntimeConfig } from "../config";
import { NewTraceMutation } from "../generated/NewTraceMutation";
import { UpdateTraceMutation } from "../generated/UpdateTraceMutation";
import { DeleteTraceMutation } from "../generated/DeleteTraceMutation";
import { createLogger } from "../utils/logger";
import { FileFragment } from "../generated/FileFragment";
import { FunctionFragment } from "../generated/FunctionFragment";
import { NewTraceInput } from "../generated/globalTypes";

const logger = createLogger(["CodeViewConnector"]);

const TRACE_FRAGMENT = gql`
    fragment TraceFragment on Trace {
        id
        statement
        line
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
        startLine
        endLine
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
            startLine
            endLine
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
    mutation NewTraceMutation($input: NewTraceInput!) {
        newTrace(newTraceInput: $input) {
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
export const CodeViewConnector = ({
    width,
    file,
}: {
    file?: FileFragment;
    width?: number;
}) => {
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
        width: width,
        fragment: data.file,
        onCreate: async (
            func: FunctionFragment,
            traceStatement: string,
            line: number
        ) => {
            logger.debug("on create was called");
            const input: NewTraceInput = {
                functionId: func.id,
                statement: traceStatement,
                line: line,
                traceSetKey: getPublicRuntimeConfig().traceSet,
            };
            const result = await newTrace({
                variables: {
                    input,
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
