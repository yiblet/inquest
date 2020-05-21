/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProbeQuery
// ====================================================

export interface ProbeQuery_probe {
  readonly __typename: "Probe";
  readonly id: string;
}

export interface ProbeQuery {
  readonly probe: ProbeQuery_probe | null;
}

export interface ProbeQueryVariables {
  readonly id: string;
}
