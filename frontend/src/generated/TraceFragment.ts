/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: TraceFragment
// ====================================================

export interface TraceFragment_currentFailures {
  readonly __typename: "TraceFailure";
  readonly message: string;
}

export interface TraceFragment {
  readonly __typename: "Trace";
  readonly id: string;
  readonly statement: string;
  readonly line: number;
  readonly active: boolean;
  readonly version: number;
  readonly currentFailures: ReadonlyArray<TraceFragment_currentFailures>;
}
