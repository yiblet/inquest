/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: LiveProbesQuery
// ====================================================

export interface LiveProbesQuery_liveProbes {
  readonly __typename: "Probe";
  readonly key: string;
}

export interface LiveProbesQuery {
  readonly liveProbes: ReadonlyArray<LiveProbesQuery_liveProbes> | null;
}
