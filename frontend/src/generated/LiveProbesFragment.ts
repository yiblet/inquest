/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: LiveProbesFragment
// ====================================================

export interface LiveProbesFragment_liveProbes {
  readonly __typename: "Probe";
  readonly id: string;
}

export interface LiveProbesFragment {
  readonly __typename: "TraceSet";
  readonly id: string;
  readonly liveProbes: ReadonlyArray<LiveProbesFragment_liveProbes> | null;
}
