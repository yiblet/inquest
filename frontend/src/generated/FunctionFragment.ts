/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: FunctionFragment
// ====================================================

export interface FunctionFragment_traces_currentFailures {
  readonly __typename: "ProbeFailure";
  readonly message: string;
}

export interface FunctionFragment_traces {
  readonly __typename: "Trace";
  readonly id: string;
  readonly statement: string;
  readonly line: number;
  readonly active: boolean;
  readonly version: number;
  readonly currentFailures: ReadonlyArray<FunctionFragment_traces_currentFailures>;
}

export interface FunctionFragment {
  readonly __typename: "FunctionInfo";
  readonly id: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly name: string;
  readonly traces: ReadonlyArray<FunctionFragment_traces>;
}
