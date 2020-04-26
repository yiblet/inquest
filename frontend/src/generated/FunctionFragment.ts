/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: FunctionFragment
// ====================================================

export interface FunctionFragment_traces_currentFailures {
  __typename: "TraceFailure";
  message: string;
}

export interface FunctionFragment_traces {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
  version: number;
  currentFailures: FunctionFragment_traces_currentFailures[];
}

export interface FunctionFragment {
  __typename: "FunctionInfo";
  id: string;
  line: number;
  name: string;
  traces: FunctionFragment_traces[];
}
