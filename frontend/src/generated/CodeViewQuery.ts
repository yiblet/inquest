/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CodeViewQuery
// ====================================================

export interface CodeViewQuery_file_functions_traces_currentFailures {
  __typename: "TraceFailure";
  message: string;
}

export interface CodeViewQuery_file_functions_traces {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
  version: number;
  currentFailures: CodeViewQuery_file_functions_traces_currentFailures[];
}

export interface CodeViewQuery_file_functions {
  __typename: "FunctionInfo";
  id: string;
  line: number;
  name: string;
  traces: CodeViewQuery_file_functions_traces[];
}

export interface CodeViewQuery_file_classes_methods_traces_currentFailures {
  __typename: "TraceFailure";
  message: string;
}

export interface CodeViewQuery_file_classes_methods_traces {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
  version: number;
  currentFailures: CodeViewQuery_file_classes_methods_traces_currentFailures[];
}

export interface CodeViewQuery_file_classes_methods {
  __typename: "FunctionInfo";
  id: string;
  line: number;
  name: string;
  traces: CodeViewQuery_file_classes_methods_traces[];
}

export interface CodeViewQuery_file_classes {
  __typename: "ClassInfo";
  id: string;
  line: number;
  name: string;
  methods: CodeViewQuery_file_classes_methods[];
}

export interface CodeViewQuery_file {
  __typename: "FileInfo";
  id: string;
  name: string;
  content: string;
  functions: CodeViewQuery_file_functions[];
  classes: CodeViewQuery_file_classes[];
}

export interface CodeViewQuery {
  file: CodeViewQuery_file | null;
}

export interface CodeViewQueryVariables {
  fileId: string;
}
