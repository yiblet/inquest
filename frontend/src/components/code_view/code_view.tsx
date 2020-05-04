import React, { useMemo, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
const MonacoEditor = dynamic(import("react-monaco-editor"), { ssr: false });
import { ExistingTrace, Editor } from "./utils";
import { Marker } from "./marker";
import { createLogger } from "../../utils/logger";
import { Traces, TraceCreator } from "./traces";
import { debounce } from "../../utils/debounce";
import { List, ImmMap } from "../../utils/collections";
import { FunctionFragment } from "../../generated/FunctionFragment";
import { CodeViewFragment } from "../../generated/CodeViewFragment";
import { TraceFragment } from "../../generated/TraceFragment";

const logger = createLogger(["CodeView"]);

export type CodeViewProps = {
    width?: number;
    fragment: CodeViewFragment;
    onEdit: (trace: ExistingTrace, traceStatement: string) => any;
    onDelete: (trace: ExistingTrace) => any;
    onCreate: (
        func: FunctionFragment,
        traceStatement: string,
        line: number
    ) => any;
};

/**
 * constructs line markers for all the current active traces
 */
function constructLineFunctionMapping(fragment: CodeViewFragment) {
    const numLines = (fragment.content.match(/\n/g)?.length ?? 0) + 1;
    const lines: (FunctionFragment | undefined)[] = new Array(numLines);

    [
        ...fragment.classes.flatMap((cls) => cls.methods),
        ...fragment.functions,
    ].forEach((func) => {
        for (let i: number = func.startLine; i <= func.endLine; i++) {
            lines[i] = func;
        }
    });

    return lines;
}

/**
 * constructs line markers for all the current active traces
 */
function constructLineMarkers(fragment: CodeViewFragment) {
    const tracesPerLine = [
        ...fragment.classes.flatMap((cls) => cls.methods),
        ...fragment.functions,
    ].reduce(
        (map, func) =>
            func.traces.reduce((map, trace) => {
                const newList = map.get(trace.line, List()).push(trace);
                return map.set(trace.line, newList);
            }, map),
        ImmMap<number, List<TraceFragment>>()
    );

    return tracesPerLine.map((traces: List<TraceFragment>, line: number) => ({
        range: new monacoEditor.Range(line, 1, line, 1),
        traces: traces,
        line: line,
        options: {
            isWholeLine: true,
            className:
                traces.flatMap((traces) => traces.currentFailures).size === 0
                    ? "bg-green-300"
                    : "bg-yellow-400",
            // TODO make the background color based on hsla + change the color on mouseHover
        },
    }));
}

const editorDidMount = (
    setEditor: (editor: Editor) => void,
    toggleMarkerVisibility: (line: number) => void
) => (editor: Editor) => {
    setEditor(editor);
    editor?.onMouseUp((event) => {
        event.target.position?.lineNumber &&
            toggleMarkerVisibility(event.target.position.lineNumber);
    });

    // @ts-ignore
    window.MonacoEnvironment.getWorkerUrl = (
        _moduleId: string,
        label: string
    ) => {
        if (label === "json") return "_next/static/json.worker.js";
        if (label === "css") return "_next/static/css.worker.js";
        if (label === "html") return "_next/static/html.worker.js";
        if (label === "typescript" || label === "javascript")
            return "_next/static/ts.worker.js";
        return "_next/static/editor.worker.js";
    };
};

export const CodeView: React.FC<CodeViewProps> = (props: CodeViewProps) => {
    const { fragment, onEdit, onDelete, onCreate } = props;
    const [editor, setEditor] = useState<Editor | null>(null);

    logger.debug("rerender");

    const lineMarkers = useMemo(() => constructLineMarkers(fragment), [
        constructLineMarkers,
        fragment,
    ]);

    const lineFunctionMapping = useMemo(
        () => constructLineFunctionMapping(fragment),
        [constructLineFunctionMapping, fragment]
    );

    useEffect(() => {
        if (!editor) return;
        const res = editor.deltaDecorations([], lineMarkers.toList().toArray());
        return () => {
            editor.deltaDecorations(res, []);
        };
    }, [fragment.content, editor, lineMarkers]);

    const [visibleLine, setVisibleLine] = useState<number | null>(null);

    const editorDidMountCallback = useCallback(
        editorDidMount(
            setEditor,
            debounce((line) =>
                setVisibleLine((curLine) => (curLine === line ? null : line))
            )
        ),
        [setEditor, setVisibleLine]
    );
    useEffect(() => editor?.layout(), [editor, props.width]);
    useEffect(() => {
        const handleResize = () => editor?.layout();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [editor]);

    let vals: React.ReactElement[] = [];
    if (editor)
        vals = lineMarkers
            .map(({ line, traces }) => {
                const fragment = lineFunctionMapping[line];
                if (!fragment) throw new Error("trace in missing function");
                return (
                    <Marker
                        key={`Trace:${line}`}
                        id={`${line}`}
                        line={line}
                        editor={editor}
                        visible={visibleLine === line}
                    >
                        <Traces
                            tag={`Trace:${line}`}
                            traces={traces}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onCreate={(statement) =>
                                onCreate(fragment, statement, line)
                            }
                        />
                    </Marker>
                );
            })
            .toList()
            .toArray();

    let createWindow = <></>;

    if (editor && visibleLine !== null && !lineMarkers.has(visibleLine)) {
        const fragment = lineFunctionMapping[visibleLine];
        if (fragment) {
            createWindow = (
                <Marker
                    key={`TraceCreator:${visibleLine}`}
                    id={`${visibleLine}`}
                    line={visibleLine}
                    editor={editor}
                    visible={true}
                >
                    <TraceCreator
                        onCreate={(statement) =>
                            onCreate(fragment, statement, visibleLine)
                        }
                    />
                </Marker>
            );
        }
    }

    return (
        <div className="w-full h-full overflow-hidden">
            <MonacoEditor
                width="100%"
                height="100%"
                language="python"
                theme="vs-light"
                value={fragment.content}
                options={{
                    minimap: {
                        enabled: false,
                    },
                    readOnly: true,
                }}
                editorDidMount={editorDidMountCallback}
            />
            {vals}
            {createWindow}
        </div>
    );
};
