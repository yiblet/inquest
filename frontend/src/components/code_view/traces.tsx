import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ExistingTrace } from "./utils";
import { PropsOf } from "../../utils/types";
import { createLogger } from "../../utils/logger";
import { ImmSet, List } from "../../utils/collections";
import { Tooltip } from "../utils/tooltip";

export function TraceFailure(props: ExistingTrace) {
    if (props.currentFailures.length == 0) {
        return <></>;
    }
    return (
        <div>
            {props.currentFailures.map((failure) => (
                <div key={failure.message}>{failure.message}</div>
            ))}
        </div>
    );
}

export function TraceViewer(props: {
    trace: ExistingTrace;
    onEdit: () => any;
    onDelete: () => any;
}) {
    return (
        <div>
            <div>
                <div className="inline-block my-2 mr-2 font-mono placeholder-gray-600">
                    <span className="text-blue-700">"</span>
                    {props.trace.statement}
                    <span className="text-blue-700">"</span>
                </div>
                <button
                    onClick={props.onEdit}
                    className="font-semibold text-black rounded mr-2"
                >
                    edit
                </button>
                <button
                    onClick={props.onDelete}
                    className="font-semibold text-red-700 text-black rounded mr-2"
                >
                    delete
                </button>
            </div>
            <div className="pl-4 bg-yellow-400">
                <TraceFailure {...props.trace} />
            </div>
        </div>
    );
}

export function TraceEditor(props: {
    trace: ExistingTrace;
    onBack: () => any;
    onSubmit: (trace: string) => any;
}) {
    const { handleSubmit, register } = useForm({
        defaultValues: {
            trace: props.trace.statement,
        },
    });
    const submit = (values: { trace: string }) => {
        props.onSubmit(values.trace);
    };
    return (
        <div className="flex">
            <form onSubmit={handleSubmit(submit)}>
                <input
                    className="my-2 mr-2 px-1 rounded bg-gray-300 placeholder-gray-600"
                    type="text"
                    autoComplete={"off"}
                    name="trace"
                    required
                    placeholder="new log string"
                    ref={register({ required: true })}
                />
                <button className="font-semibold text-yellow-600 rounded mr-2">
                    modify
                </button>
            </form>
            <button
                onClick={props.onBack}
                className="font-semibold text-black p-1 rounded mr-2"
            >
                back
            </button>
        </div>
    );
}

export function TraceCreator(props: { onCreate: (trace: string) => any }) {
    const { handleSubmit, register, reset } = useForm();
    const submit = (values: { trace?: string }) => {
        if (values.trace) {
            props.onCreate(values.trace);
            reset();
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} className="inline-block">
            <input
                className="my-2 mr-2 bg-gray-300 min-w-2xl placeholder-gray-600 rounded px-1"
                type="text"
                name="trace"
                autoComplete={"off"}
                required
                placeholder="add log statement"
                ref={register({ required: true })}
            />
            <button type="submit" className="font-semibold text-blue-600">
                create
            </button>
            <div className="mx-2 inline-block text-gray-600">
                <Tooltip width="20rem">
                    <div className="p-2 border shadow-md rounded bg-white text-black">
                        You can log python variables by using
                        <code className="mx-2 p-1 bg-gray-200 rounded">
                            {"{bracket}"}
                        </code>
                        format.
                    </div>
                </Tooltip>
            </div>
        </form>
    );
}

export const CodePopup: React.FC = ({ children }) => {
    return (
        <div className="inline-block py-2 px-4 border border-black rounded-lg bg-white shadow-lg">
            {children}
        </div>
    );
};

export function Traces(props: {
    lineno: number;
    tag: string;
    traces: List<ExistingTrace>;
    onDelete: (trace: ExistingTrace) => any;
    onEdit: (trace: ExistingTrace, traceStatement: string) => any;
    onCreate: (traceStatement: string) => any;
}) {
    const logger = createLogger([props.tag]);
    logger.debug(`rerender size=${props.traces.size}`);

    const [editing, setState] = useState(ImmSet<string>());
    useEffect(() => setState(ImmSet()), [props.tag]);

    return (
        <CodePopup>
            <div className="grid grid-cols-1 gap-1 w-full h-full">
                <span className="font-medium">Current Logs</span>
                {props.traces.map((trace: ExistingTrace) =>
                    editing.has(trace.id) ? (
                        <TraceEditor
                            trace={trace}
                            key={trace.id}
                            onBack={() =>
                                setState((state) => state.delete(trace.id))
                            }
                            onSubmit={(statement) => {
                                props.onEdit(trace, statement);
                                setState((state) => state.delete(trace.id));
                            }}
                        />
                    ) : (
                        <TraceViewer
                            trace={trace}
                            key={trace.id}
                            onEdit={() => {
                                setState((state) => state.add(trace.id));
                            }}
                            onDelete={() => props.onDelete(trace)}
                        />
                    )
                )}
                <span className="font-medium">
                    Create Log After Line {props.lineno}{" "}
                </span>
                <TraceCreator onCreate={props.onCreate} />
            </div>
        </CodePopup>
    );
}

export type TracesProps = PropsOf<typeof Traces>;
