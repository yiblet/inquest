/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CodeViewFragment
// ====================================================

export interface CodeViewFragment_functions_traces_currentFailures {
  readonly __typename: "TraceFailure";
  readonly message: string;
}

export interface CodeViewFragment_functions_traces {
  readonly __typename: "Trace";
  readonly id: string;
  readonly statement: string;
  readonly line: number;
  readonly active: boolean;
  readonly version: number;
  readonly currentFailures: ReadonlyArray<CodeViewFragment_functions_traces_currentFailures>;
}

export interface CodeViewFragment_functions {
  readonly __typename: "FunctionInfo";
  readonly id: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly name: string;
  readonly traces: ReadonlyArray<CodeViewFragment_functions_traces>;
}

export interface CodeViewFragment_classes_methods_traces_currentFailures {
  readonly __typename: "TraceFailure";
  readonly message: string;
}

export interface CodeViewFragment_classes_methods_traces {
  readonly __typename: "Trace";
  readonly id: string;
  readonly statement: string;
  readonly line: number;
  readonly active: boolean;
  readonly version: number;
  readonly currentFailures: ReadonlyArray<CodeViewFragment_classes_methods_traces_currentFailures>;
}

export interface CodeViewFragment_classes_methods {
  readonly __typename: "FunctionInfo";
  readonly id: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly name: string;
  readonly traces: ReadonlyArray<CodeViewFragment_classes_methods_traces>;
}

export interface CodeViewFragment_classes {
  readonly __typename: "ClassInfo";
  readonly id: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly name: string;
  readonly methods: ReadonlyArray<CodeViewFragment_classes_methods>;
}

export interface CodeViewFragment {
  readonly __typename: "FileInfo";
  readonly id: string;
  readonly name: string;
  readonly content: string;
  readonly functions: ReadonlyArray<CodeViewFragment_functions>;
  readonly classes: ReadonlyArray<CodeViewFragment_classes>;
}
