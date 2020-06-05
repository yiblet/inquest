import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ExistingTrace } from "./utils";
import { PropsOf } from "../../utils/types";
import { createLogger } from "../../utils/logger";
import { ImmSet, List } from "../../utils/collections";

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
                <div className="inline-block my-2 mr-2 font-mono placeholder-black">
                    <span className="text-blue-700">logging "</span>
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
                    className="my-2 mr-2 px-1 rounded bg-gray-300 placeholder-black"
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

export function TraceCreator(props: {
    onCreate: (trace: string) => any;
    hasBorder?: boolean;
}) {
    const { handleSubmit, register, reset } = useForm();
    const submit = (values: { trace?: string }) => {
        if (values.trace) {
            props.onCreate(values.trace);
            reset();
        }
    };

    const borderClass = props.hasBorder ?  "py-2 px-4 border border-black rounded-lg bg-white shadow-lg inline-block" : "inline-block"

    return (
        <form onSubmit={handleSubmit(submit)} className="">
            <div className={borderClass}>
                <input
                    className="my-2 mr-2 bg-gray-300 placeholder-black rounded px-1"
                    type="text"
                    name="trace"
                    autoComplete={"off"}
                    required
                    placeholder="new log string"
                    ref={register({ required: true })}
                />
                <button type="submit" className="font-semibold text-blue-600">
                    create
                </button>
            </div>
        </form>
    );
}

export function Traces(props: {
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
        <div className="flex flex-col w-full h-full bg-white px-4 py-2 border border-black rounded shadow-xl">
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
            <TraceCreator onCreate={props.onCreate} />
        </div>
    );
}

export type TracesProps = PropsOf<typeof Traces>;
