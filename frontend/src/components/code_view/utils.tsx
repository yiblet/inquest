import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";

export type Trace = string;
export type FuncName = string;

export type ExistingTrace = {
    id: string;
    active: boolean;
    trace: Trace;
    funcName: FuncName;
};

export type Editor = monacoEditor.editor.IStandaloneCodeEditor;
export type Monaco = typeof monacoEditor;
