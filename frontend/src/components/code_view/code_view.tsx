import React from "react";
import { Floater, Position } from "./floater";
import dynamic from "next/dynamic";
import {
    CodeParser,
    FunctionPosition,
    ClassPosition,
} from "../../utils/code_parser";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
const MonacoEditor = dynamic(import("react-monaco-editor"), { ssr: false });
import { ExistingTrace, Editor, Monaco } from "./utils";
import { Marker } from "./marker";

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
};

/**
 * CodeView encapsulates all the the different interactions done on visually for
 * locating and editing logs
 */
export class CodeView extends React.Component<CodeViewProps, CodeViewState> {
    private data: { editor: Editor; monaco: Monaco } | null;
    private markers: { [line: number]: Marker };

    constructor(props: CodeViewProps) {
        super(props);
        const parser = new CodeParser(props.code);
        this.state = {
            position: null,
            functions: parser.findFunctions(),
            classes: parser.findClasses(),
            decorations: [],
        };
        this.data = null;
        this.markers = {};

        this.editorDidMount.bind(this);
    }

    get editor() {
        return this.data?.editor || null;
    }

    get monaco() {
        return this.data?.monaco || null;
    }

    setDecorations(decorations: monacoEditor.editor.IModelDeltaDecoration[]) {
        const result = this.editor?.deltaDecorations(
            this.state.decorations,
            decorations
        );
        if (result) this.setState({ decorations: result });
    }

    constructLineMarkers() {
        const monaco = this.monaco;
        const editor = this.editor;
        if (!monaco || !editor) return null;

        const traces: Map<string, ExistingTrace[]> = this.props.traces.reduce(
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
            ...this.state.classes.flatMap((cls) =>
                cls.methods.map((method) => ({
                    ...method,
                    name: method.name,
                }))
            ),
            ...this.state.functions,
        ].map((func) => ({
            range: new monaco.Range(func.line, 1, func.line, 1),
            line: func.line,
            name: func.name,
            traces: traces.get(func.name) ?? [],
            options: {
                isWholeLine: true,
                className: "bg-green-300", // TODO make the background color based on hsla + change the color on mouseHover
            },
        }));
    }

    componentWillUnmount() {
        for (const marker of Object.values(this.markers)) {
            marker.unmount();
        }
    }

    /**
     * editorDidMount is called once the editor is visible
     */
    editorDidMount = (editor: Editor, monaco: Monaco) => {
        this.data = {
            editor,
            monaco,
        };

        const lineMarkers = this.constructLineMarkers();
        if (lineMarkers) {
            this.markers = lineMarkers.reduce((acc, val) => {
                acc[val.line] = new Marker(editor, val.name, val.line, {
                    traces: val.traces,
                    onEdit: this.props.onEdit,
                    onCreate: (statement) =>
                        this.props.onCreate(val.name, statement),
                    onDelete: this.props.onDelete,
                });
                return acc;
            }, {});

            this.setDecorations(lineMarkers);
        }

        this.editor?.onMouseUp((event) => {
            const marker =
                event.target.position?.lineNumber &&
                this.markers[event.target.position.lineNumber];
            if (marker instanceof Marker) {
                marker.onMouseUp(event);
            }
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

    render() {
        const { code } = this.props;
        return (
            <div className="w-full h-full">
                <Floater position={this.state.position}>
                    <div className="w-20 h-20 bg-black"></div>
                </Floater>
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
                    editorDidMount={this.editorDidMount}
                />
            </div>
        );
    }
}
