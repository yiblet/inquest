/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateTraceMutation
// ====================================================

export interface UpdateTraceMutation_updateTrace_currentFailures {
  readonly __typename: "TraceFailure";
  readonly message: string;
}

export interface UpdateTraceMutation_updateTrace {
  readonly __typename: "Trace";
  readonly id: string;
  readonly statement: string;
  readonly active: boolean;
  readonly version: number;
  readonly currentFailures: ReadonlyArray<UpdateTraceMutation_updateTrace_currentFailures>;
}

export interface UpdateTraceMutation {
  readonly updateTrace: UpdateTraceMutation_updateTrace;
}

export interface UpdateTraceMutationVariables {
  readonly active?: boolean | null;
  readonly statement?: string | null;
  readonly id: string;
}
