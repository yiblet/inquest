import React, {
    useMemo,
    useReducer,
    useState,
    useEffect,
    useCallback,
} from "react";
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

const logger = createLogger(["CodeView"]);

export type CodeViewProps = {
    code: string;
    className?: string;
    traces: ExistingTrace[];
    onEdit: (trace: ExistingTrace, traceStatement: string) => any;
    onDelete: (trace: ExistingTrace) => any;
    onCreate: (funcName: string, traceStatement: string) => any;
};

export type CodeViewState = {
    position: Position | null;
    functions: FunctionPosition[];
    classes: ClassPosition[];
    decorations: string[];
    markers?: { [id: number]: MarkerProps };
};

function constructLineMarkers(
    traces: ExistingTrace[],
    functions: FunctionPosition[],
    classes: ClassPosition[]
) {
    const tracesMap: Map<string, ExistingTrace[]> = traces.reduce(
        (map: Map<string, ExistingTrace[]>, trace) => {
            if (map.has(trace.funcName)) {
                map.get(trace.funcName)?.push(trace);
            } else {
                map.set(trace.funcName, [trace]);
            }
            return map;
        },
        new Map()
    );

    return [
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
        traces: tracesMap.get(func.name) ?? [],
        options: {
            isWholeLine: true,
            className: "bg-green-300", // TODO make the background color based on hsla + change the color on mouseHover
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

type MarkerData = {
    name: string;
    line: number;
    visible: boolean;
    traces: ExistingTrace[];
};

type Markers = { [line: number]: MarkerData };

type Action =
    | {
          type: "SET_MARKERS";
          payload: MarkerData;
      }
    | {
          type: "TOGGLE_VISIBILITY";
          payload: number;
      };

function markerReducer(markers: Markers, action: Action): Markers {
    logger.debug(`${action.type} fired`);
    switch (action.type) {
        case "SET_MARKERS":
            return action.payload;
        case "TOGGLE_VISIBILITY":
            const marker = markers[action.payload];
            if (!marker) return markers;
            marker.visible = !marker.visible;
            return {
                ...markers,
                [action.payload]: marker,
            };
        default:
            return markers;
    }
}

export const CodeView: React.FC<CodeViewProps> = (props: CodeViewProps) => {
    const { code, className, traces, onEdit, onDelete, onCreate } = props;
    const [functions, classes] = useMemo(() => {
        const parser = new CodeParser(code);
        return [parser.findFunctions(), parser.findClasses()];
    }, [code]);

    const [editor, setEditor] = useState<Editor | null>(null);
    const setDecorations = useReducer(
        (
            decorations: string[],
            newDecorations: monacoEditor.editor.IModelDeltaDecoration[]
        ) => {
            return editor?.deltaDecorations(decorations, newDecorations) ?? [];
        },
        [],
        (_) => []
    )[1];

    logger.debug(`traces: size=${traces.length}`);
    const lineMarkers = useMemo(() => {
        return constructLineMarkers(traces, functions, classes);
    }, [constructLineMarkers, traces, functions, classes]);
    useEffect(() => setDecorations(lineMarkers), [editor, lineMarkers]);

    const [visibility, dispatch] = useReducer(
        (visibility: { [line: number]: boolean }, line: number) => {
            if (visibility[line] !== undefined) {
                const vis = { ...visibility };
                vis[line] = !vis[line];
                return vis;
            }
            return visibility;
        },
        [],
        () => {
            let res: { [line: number]: boolean } = {};
            for (const { line } of lineMarkers) {
                res[line] = false;
            }
            return res;
        }
    );

    const editorDidMountCallback = useCallback(
        editorDidMount(setEditor, debounce(dispatch)),
        [setEditor, visibility]
    );

    const markers = useMemo(() => {
        const res: Markers = {};
        for (const { line, name, traces } of lineMarkers) {
            res[line] = {
                line,
                name,
                traces,
                visible: visibility[line] || false,
            };
        }
        return res;
    }, [lineMarkers, visibility]);

    let vals: React.ReactElement[] = [];
    if (editor)
        vals = Object.values(markers).map((marker) => {
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
        });

    return (
        <div className="w-full h-full">
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
