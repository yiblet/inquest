/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: TraceSetQuery
// ====================================================

export interface TraceSetQuery_traceSet {
  readonly __typename: "TraceSet";
  readonly id: string;
}

export interface TraceSetQuery {
  /**
   * creates a traceSet with a given id
   */
  readonly traceSet: TraceSetQuery_traceSet | null;
}

export interface TraceSetQueryVariables {
  readonly id: string;
}
