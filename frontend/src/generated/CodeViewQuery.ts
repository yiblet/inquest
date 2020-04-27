/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CodeViewQuery
// ====================================================

export interface CodeViewQuery_file_functions_traces_currentFailures {
  readonly __typename: "TraceFailure";
  readonly message: string;
}

export interface CodeViewQuery_file_functions_traces {
  readonly __typename: "Trace";
  readonly id: string;
  readonly statement: string;
  readonly active: boolean;
  readonly version: number;
  readonly currentFailures: ReadonlyArray<CodeViewQuery_file_functions_traces_currentFailures>;
}

export interface CodeViewQuery_file_functions {
  readonly __typename: "FunctionInfo";
  readonly id: string;
  readonly line: number;
  readonly name: string;
  readonly traces: ReadonlyArray<CodeViewQuery_file_functions_traces>;
}

export interface CodeViewQuery_file_classes_methods_traces_currentFailures {
  readonly __typename: "TraceFailure";
  readonly message: string;
}

export interface CodeViewQuery_file_classes_methods_traces {
  readonly __typename: "Trace";
  readonly id: string;
  readonly statement: string;
  readonly active: boolean;
  readonly version: number;
  readonly currentFailures: ReadonlyArray<CodeViewQuery_file_classes_methods_traces_currentFailures>;
}

export interface CodeViewQuery_file_classes_methods {
  readonly __typename: "FunctionInfo";
  readonly id: string;
  readonly line: number;
  readonly name: string;
  readonly traces: ReadonlyArray<CodeViewQuery_file_classes_methods_traces>;
}

export interface CodeViewQuery_file_classes {
  readonly __typename: "ClassInfo";
  readonly id: string;
  readonly line: number;
  readonly name: string;
  readonly methods: ReadonlyArray<CodeViewQuery_file_classes_methods>;
}

export interface CodeViewQuery_file {
  readonly __typename: "FileInfo";
  readonly id: string;
  readonly name: string;
  readonly content: string;
  readonly functions: ReadonlyArray<CodeViewQuery_file_functions>;
  readonly classes: ReadonlyArray<CodeViewQuery_file_classes>;
}

export interface CodeViewQuery {
  readonly file: CodeViewQuery_file | null;
}

export interface CodeViewQueryVariables {
  readonly fileId: string;
}
