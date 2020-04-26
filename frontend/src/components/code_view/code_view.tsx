import React, { useMemo, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
const MonacoEditor = dynamic(import("react-monaco-editor"), { ssr: false });
import { ExistingTrace, Editor } from "./utils";
import { Marker } from "./marker";
import { createLogger } from "../../utils/logger";
import { Traces } from "./traces";
import { debounce } from "../../utils/debounce";
import { List } from "../../utils/collections";
import { FunctionFragment } from "../../generated/FunctionFragment";
import { CodeViewFragment } from "../../generated/CodeViewFragment";

const logger = createLogger(["CodeView"]);

export type CodeViewProps = {
    fragment: CodeViewFragment;
    onEdit: (trace: ExistingTrace, traceStatement: string) => any;
    onDelete: (trace: ExistingTrace) => any;
    onCreate: (func: FunctionFragment, traceStatement: string) => any;
};

function constructLineMarkers(fragment: CodeViewFragment) {
    return List(
        [
            ...fragment.classes.flatMap((cls) =>
                cls.methods.map((method) => ({
                    ...method,
                    name: method.name,
                }))
            ),
            ...fragment.functions,
        ].map((func: FunctionFragment) => ({
            range: new monacoEditor.Range(func.line, 1, func.line, 1),
            func: func,
            options: {
                isWholeLine: true,
                className:
                    func.traces.flatMap((traces) => traces.currentFailures)
                        .length === 0
                        ? "bg-green-300"
                        : "bg-yellow-400", // TODO make the background color based on hsla + change the color on mouseHover
            },
        }))
    );
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

    const lineMarkers = useMemo(() => {
        return constructLineMarkers(fragment);
    }, [constructLineMarkers, fragment]);
    useEffect(() => {
        if (!editor) return;
        const res = editor.deltaDecorations([], lineMarkers.toArray());
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

    let vals: React.ReactElement[] = [];
    if (editor)
        vals = lineMarkers
            .valueSeq()
            .map(({ func }) => {
                return (
                    <Marker
                        key={`Trace:${func.line}`}
                        name={func.id}
                        line={func.line}
                        editor={editor}
                        visible={visibleLine === func.line}
                    >
                        <Traces
                            tag={`Trace:${func.line}`}
                            traces={List(func.traces)}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onCreate={(statement) => onCreate(func, statement)}
                        />
                    </Marker>
                );
            })
            .toArray();

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
        </div>
    );
};
