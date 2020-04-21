/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteTraceMutation
// ====================================================

export interface DeleteTraceMutation_deleteTrace {
  __typename: "Trace";
  id: string;
}

export interface DeleteTraceMutation {
  deleteTrace: DeleteTraceMutation_deleteTrace;
}

export interface DeleteTraceMutationVariables {
  id: string;
}
