import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ExistingTrace } from "./utils";
import { PropsOf } from "../../utils/types";
import { createLogger } from "../../utils/logger";
import { ImmSet, List } from "../../utils/collections";

export function TraceViewer(props: {
    trace: ExistingTrace;
    onEdit: () => any;
    onDelete: () => any;
}) {
    return (
        <div>
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
            trace: props.trace.trace,
        },
    });
    const submit = (values: { trace: string }) => {
        props.onSubmit(values.trace);
    };
    return (
        <div className="flex">
            <form onSubmit={handleSubmit(submit)}>
                <input
                    className="my-2 mr-2 bg-green-300 placeholder-black"
                    type="text"
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
        <div className="flex flex-col w-full h-full bg-green-200 pl-2">
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
