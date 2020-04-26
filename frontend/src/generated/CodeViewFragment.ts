/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CodeViewFragment
// ====================================================

export interface CodeViewFragment_functions_traces_currentFailures {
  __typename: "TraceFailure";
  message: string;
}

export interface CodeViewFragment_functions_traces {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
  version: number;
  currentFailures: CodeViewFragment_functions_traces_currentFailures[];
}

export interface CodeViewFragment_functions {
  __typename: "FunctionInfo";
  id: string;
  line: number;
  name: string;
  traces: CodeViewFragment_functions_traces[];
}

export interface CodeViewFragment_classes_methods_traces_currentFailures {
  __typename: "TraceFailure";
  message: string;
}

export interface CodeViewFragment_classes_methods_traces {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
  version: number;
  currentFailures: CodeViewFragment_classes_methods_traces_currentFailures[];
}

export interface CodeViewFragment_classes_methods {
  __typename: "FunctionInfo";
  id: string;
  line: number;
  name: string;
  traces: CodeViewFragment_classes_methods_traces[];
}

export interface CodeViewFragment_classes {
  __typename: "ClassInfo";
  id: string;
  line: number;
  name: string;
  methods: CodeViewFragment_classes_methods[];
}

export interface CodeViewFragment {
  __typename: "FileInfo";
  id: string;
  name: string;
  content: string;
  functions: CodeViewFragment_functions[];
  classes: CodeViewFragment_classes[];
}
