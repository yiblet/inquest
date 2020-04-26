import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import { TraceFragment } from "../../generated/TraceFragment";

export type Trace = string;
export type FuncName = string;

export type ExistingTrace = TraceFragment;

export type Editor = monacoEditor.editor.IStandaloneCodeEditor;
export type Monaco = typeof monacoEditor;
