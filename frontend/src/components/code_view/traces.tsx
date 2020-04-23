import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ExistingTrace } from "./utils";
import { PropsOf } from "../../utils/types";
import { createLogger } from "../../utils/logger";

export function TraceViewer(props: {
    trace: ExistingTrace;
    onEdit: () => any;
    onDelete: () => any;
}) {
    return (
        <form>
            <div className="inline-block my-2 mr-2 font-mono placeholder-black">
                <span className="text-green-700">logging "</span>
                {props.trace.trace}
                <span className="text-green-700">"</span>
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
        </form>
    );
}

export function TraceEditor(props: {
    trace: ExistingTrace;
    onBack: () => any;
    onSubmit: (trace: string) => any;
}) {
    const { handleSubmit, register } = useForm();
    const submit = (values: { trace: string }) => {
        props.onSubmit(values.trace);
    };
    return (
        <>
            <form onSubmit={handleSubmit(submit)}>
                <input
                    className="my-2 mr-2 bg-green-300 placeholder-black"
                    type="text"
                    name="trace"
                    value={props.trace.trace}
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
        </>
    );
}

export function TraceCreator(props: { onCreate: (trace: string) => any }) {
    const { handleSubmit, register } = useForm();
    const submit = (values: { trace?: string }) => {
        values.trace && props.onCreate(values.trace);
    };
    return (
        <form onSubmit={handleSubmit(submit)}>
            <input
                className="my-2 mr-2 bg-green-300 placeholder-black"
                name="trace"
                required
                placeholder="new log string"
                ref={register({ required: true })}
            />
            <button type="submit" className="font-semibold text-green-700">
                create
            </button>
        </form>
    );
}

export function Traces(props: {
    tag: string;
    traces: ExistingTrace[];
    onDelete: (trace: ExistingTrace) => any;
    onEdit: (trace: ExistingTrace, traceStatement: string) => any;
    onCreate: (traceStatement: string) => any;
}) {
    const logger = createLogger([props.tag]);
    logger.debug(`rerender size=${props.traces.length}`);

    const [editing, setState] = useState(new Set<string>());
    useEffect(() => setState(new Set()), [props.tag]);

    return (
        <div className="flex flex-col w-full h-full bg-green-200 pl-2">
            {props.traces
                .filter((trace) => !editing.has(trace.id))
                .map((trace) => (
                    <TraceViewer
                        trace={trace}
                        key={trace.id}
                        onEdit={() => {
                            setState((state) => {
                                state.add(trace.id);
                                return state;
                            });
                        }}
                        onDelete={() => props.onDelete(trace)}
                    />
                ))}
            {props.traces
                .filter((trace) => editing.has(trace.id))
                .map((trace) => (
                    <TraceEditor
                        trace={trace}
                        key={trace.id}
                        onBack={() =>
                            setState((state) => {
                                state.delete(trace.id);
                                return state;
                            })
                        }
                        onSubmit={(statement) => props.onEdit(trace, statement)}
                    />
                ))}
            <TraceCreator onCreate={props.onCreate} />
        </div>
    );
}

export type TracesProps = PropsOf<typeof Traces>;
