import { render, unmountComponentAtNode } from "react-dom";
import React, { useState } from "react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import { useForm } from "react-hook-form";
import { Editor, ExistingTrace } from "./utils";
import { PropsOf } from "../../utils/types";

class ContentWidget implements monacoEditor.editor.IContentWidget {
    private domNode: HTMLElement;
    constructor(
        private name: string,
        private line: number,
        callback: (element: HTMLElement | null) => any,
        props: MarkerComponentProps
    ) {
        this.unmount = this.unmount.bind(this);
        this.domNode = document.createElement("div");
        this.domNode.className = "w-screen";
        render(
            <div ref={callback}>
                <MarkerComponent {...props} />
            </div>,
            this.domNode
        );
    }

    unmount() {
        unmountComponentAtNode(this.domNode);
    }

    getDomNode() {
        return this.domNode;
    }

    getId() {
        return this.name;
    }

    get height() {
        return this.domNode.offsetHeight;
    }

    getPosition() {
        return {
            position: {
                lineNumber: this.line,
                column: 5,
            },
            range: null,
            preference: [
                monacoEditor.editor.ContentWidgetPositionPreference.BELOW,
            ],
        };
    }
}

/**
 * Maintains the state of each marker
 */
export class Marker {
    private viewZoneId: string | null = null;

    private contentWidget: ContentWidget;
    private domNode: HTMLDivElement;

    constructor(
        private editor: Editor,
        public readonly name: string,
        public readonly line: number,
        props: MarkerComponentProps
    ) {
        this.onMouseUp = this.onMouseUp.bind(this);
        this.unmount = this.unmount.bind(this);
        this.onChangeViewZones = this.onChangeViewZones.bind(this);
        this.updateDomHeight = this.updateDomHeight.bind(this);

        this.contentWidget = new ContentWidget(
            name,
            line,
            this.updateDomHeight,
            props
        );
        this.domNode = document.createElement("div");
        this.domNode.className = "bg-green-200";
    }

    unmount() {
        this.contentWidget.unmount();
    }

    updateDomHeight(element: HTMLElement | null) {
        if (element) {
            this.editor.changeViewZones(
                (changeAccessor) =>
                    (this.viewZoneId = changeAccessor.addZone({
                        afterLineNumber: this.line,
                        heightInPx: element.offsetHeight,
                        domNode: this.domNode,
                    }))
            );
        }
    }

    onChangeViewZones(
        changeAccessor: monacoEditor.editor.IViewZoneChangeAccessor
    ) {
        if (this.viewZoneId) {
            // remove viewZone
            changeAccessor.removeZone(this.viewZoneId);
            this.editor.removeContentWidget(this.contentWidget);
            this.viewZoneId = null;
        } else {
            this.editor.addContentWidget(this.contentWidget);
            // add viewZone again
            this.viewZoneId = changeAccessor.addZone({
                afterLineNumber: this.line,
                heightInPx: this.contentWidget.height,
                domNode: this.domNode,
            });
        }
    }

    onMouseUp(event: monacoEditor.editor.IEditorMouseEvent) {
        this.editor.changeViewZones(this.onChangeViewZones);
    }
}

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
        console.log(values);
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

export function MarkerComponent(props: {
    traces: ExistingTrace[];
    onDelete: (trace: ExistingTrace) => any;
    onEdit: (trace: ExistingTrace, traceStatement: string) => any;
    onCreate: (traceStatement: string) => any;
}) {
    const [state, setState] = useState({
        viewedTraces: new Set(props.traces),
        editedTraces: new Set<ExistingTrace>(),
    });

    return (
        <div
            className="flex flex-col w-full h-full bg-green-200 pl-2"
            onClick={(_) => console.log("click!")}
        >
            {Array.from(state.viewedTraces.values()).map((trace) => (
                <TraceViewer
                    trace={trace}
                    key={trace.id}
                    onEdit={() => {
                        setState((state) => {
                            state.viewedTraces.delete(trace);
                            state.editedTraces.add(trace);
                            return state;
                        });
                    }}
                    onDelete={() => props.onDelete(trace)}
                />
            ))}
            {Array.from(state.editedTraces.values()).map((trace) => (
                <TraceEditor
                    trace={trace}
                    key={trace.id}
                    onBack={() =>
                        setState((state) => {
                            state.editedTraces.delete(trace);
                            state.viewedTraces.add(trace);
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

export type MarkerComponentProps = PropsOf<typeof MarkerComponent>;
