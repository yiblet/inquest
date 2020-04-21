/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateTraceMutation
// ====================================================

export interface UpdateTraceMutation_updateTrace {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
}

export interface UpdateTraceMutation {
  updateTrace: UpdateTraceMutation_updateTrace;
}

export interface UpdateTraceMutationVariables {
  active?: boolean | null;
  statement?: string | null;
  id: string;
}
