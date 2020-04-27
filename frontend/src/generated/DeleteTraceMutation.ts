/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteTraceMutation
// ====================================================

export interface DeleteTraceMutation_deleteTrace {
  readonly __typename: "Trace";
  readonly id: string;
}

export interface DeleteTraceMutation {
  readonly deleteTrace: DeleteTraceMutation_deleteTrace;
}

export interface DeleteTraceMutationVariables {
  readonly id: string;
}
