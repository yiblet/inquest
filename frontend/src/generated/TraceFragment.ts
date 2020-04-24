/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: TraceFragment
// ====================================================

export interface TraceFragment_currentFailures {
  __typename: "TraceFailure";
  message: string;
}

export interface TraceFragment {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
  version: number;
  currentFailures: TraceFragment_currentFailures[];
}
