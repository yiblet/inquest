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
import { List } from "immutable";

const logger = createLogger(["CodeViewConnector"]);

const TRACE_FRAGMENT = gql`
    fragment TraceFragment on Trace {
        id
        statement
        active
    }
`;

const CODE_VIEW_QUERY = gql`
    query CodeViewQuery($fileId: String!) {
        file(fileId: $fileId) {
            name
            content
            module {
                name
                childFunctions {
                    name
                    traces {
                        ...TraceFragment
                    }
                }
                childClasses {
                    name
                    methods {
                        name
                        traces {
                            ...TraceFragment
                        }
                    }
                }
            }
        }
    }
    ${TRACE_FRAGMENT}
`;

const NEW_TRACE = gql`
    mutation NewTraceMutation(
        $module: String!
        $function: String!
        $statement: String!
        $key: String!
    ) {
        newTrace(
            newTraceInput: {
                module: $module
                function: $function
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
 * parseExistingTraces converts query data into the internal ExistingTrace representation
 */
const parseExistingTraces = (
    queryResult: CodeViewQuery
): List<ExistingTrace> => {
    if (!queryResult.file?.module)
        throw new Error("couldn't find associated module");
    const res = List([
        ...queryResult.file.module.childFunctions.flatMap((func) =>
            func.traces.map((trace) => {
                return {
                    id: trace.id,
                    active: trace.active,
                    funcName: func.name,
                    trace: trace.statement,
                };
            })
        ),
        ...queryResult.file.module.childClasses.flatMap((childClass) =>
            childClass.methods.flatMap((func) =>
                func.traces.map((trace) => {
                    return {
                        id: trace.id,
                        active: trace.active,
                        funcName: `${childClass.name}.${func.name}`,
                        trace: trace.statement,
                    };
                })
            )
        ),
    ]);
    return res;
};

/**
 * CodeViewConnector maps data from the graphql queries and mutations back into the CodeView
 */
export const CodeViewConnector = ({ fileId }: { fileId?: string }) => {
    const emptyView = (
        <div
            className="w-full h-screen"
            style={{
                backgroundColor: "white",
            }}
        ></div>
    );
    if (!fileId) {
        return emptyView;
    }
    const { loading, error, data, refetch } = useQuery<CodeViewQuery>(
        CODE_VIEW_QUERY,
        {
            variables: { fileId },
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
        traces: parseExistingTraces(data),
        code: data.file.content,
        onCreate: async (funcName, traceStatement) => {
            logger.debug("on create was called");
            if (!data.file?.module?.name) {
                throw new Error("cannot not find module name");
            }
            const result = await newTrace({
                variables: {
                    module: data.file.module.name,
                    function: funcName,
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

    logger.debug(`traces: size=${props.traces.size}`);
    return <CodeView  {...props} />;
};

export type CodeViewConnectorProps = PropsOf<typeof CodeViewConnector>;
