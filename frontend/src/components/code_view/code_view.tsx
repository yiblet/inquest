import React, { useMemo, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
    CodeParser,
    FunctionPosition,
    ClassPosition,
} from "../../utils/code_parser";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
const MonacoEditor = dynamic(import("react-monaco-editor"), { ssr: false });
import { ExistingTrace, Editor } from "./utils";
import { Marker, MarkerProps } from "./marker";
import { createLogger } from "../../utils/logger";
import { Traces } from "./traces";
import { debounce } from "../../utils/debounce";
import { ImmMap, List } from "../../utils/collections";

const logger = createLogger(["CodeView"]);

export type CodeViewProps = {
    code: string;
    traces: List<ExistingTrace>;
    onEdit: (trace: ExistingTrace, traceStatement: string) => any;
    onDelete: (trace: ExistingTrace) => any;
    onCreate: (funcName: string, traceStatement: string) => any;
};

export type CodeViewState = {
    position: Position | null;
    functions: FunctionPosition[];
    classes: ClassPosition[];
    decorations: string[];
    markers?: ImmMap<number, MarkerProps>;
};

function constructLineMarkers(
    traces: List<ExistingTrace>,
    functions: FunctionPosition[],
    classes: ClassPosition[]
) {
    const tracesMap: Map<string, List<ExistingTrace>> = traces.reduce(
        (map: Map<string, List<ExistingTrace>>, trace) => {
            map.set(
                trace.funcName,
                map.get(trace.funcName)?.push(trace) ?? List([trace])
            );
            return map;
        },
        new Map()
    );

    return List(
        [
            ...classes.flatMap((cls) =>
                cls.methods.map((method) => ({
                    ...method,
                    name: method.name,
                }))
            ),
            ...functions,
        ].map((func) => ({
            range: new monacoEditor.Range(func.line, 1, func.line, 1),
            line: func.line,
            name: func.name,
            traces: tracesMap.get(func.name) ?? List<ExistingTrace>(),
            options: {
                isWholeLine: true,
                className: "cursor-pointer bg-green-300", // TODO make the background color based on hsla + change the color on mouseHover
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

type MarkerData = {
    name: string;
    line: number;
    visible: boolean;
    traces: List<ExistingTrace>;
};

export const CodeView: React.FC<CodeViewProps> = (props: CodeViewProps) => {
    const { code, traces, onEdit, onDelete, onCreate } = props;
    const [functions, classes] = useMemo(() => {
        const parser = new CodeParser(code);
        return [parser.findFunctions(), parser.findClasses()];
    }, [code]);

    const [editor, setEditor] = useState<Editor | null>(null);

    logger.info(`traces: size=${traces.size}`);
    const lineMarkers = useMemo(() => {
        return constructLineMarkers(traces, functions, classes);
    }, [constructLineMarkers, traces, functions, classes]);
    useEffect(() => {
        if (!editor) return;
        const res = editor.deltaDecorations([], lineMarkers.toArray());
        return () => {
            editor.deltaDecorations(res, []);
        };
    }, [code, editor, lineMarkers]);

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

    const markers = useMemo(
        () =>
            lineMarkers.reduce(
                (map, { line, name, traces }) =>
                    map.set(line, {
                        line,
                        name,
                        traces,
                        visible: visibleLine !== null && visibleLine === line,
                    }),
                ImmMap<number, MarkerData>()
            ),
        [lineMarkers, visibleLine]
    );

    let vals: React.ReactElement[] = [];
    if (editor)
        vals = markers
            .valueSeq()
            .map((marker) => {
                return (
                    <Marker
                        key={`Trace:${marker.line}`}
                        {...marker}
                        editor={editor}
                    >
                        <Traces
                            tag={`Trace:${marker.line}`}
                            traces={marker.traces}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onCreate={(statement) =>
                                onCreate(marker.name, statement)
                            }
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
                value={code}
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
