/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { NewTraceInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: NewTraceMutation
// ====================================================

export interface NewTraceMutation_newTrace_currentFailures {
  readonly __typename: "TraceFailure";
  readonly message: string;
}

export interface NewTraceMutation_newTrace {
  readonly __typename: "Trace";
  readonly id: string;
  readonly statement: string;
  readonly line: number;
  readonly active: boolean;
  readonly version: number;
  readonly currentFailures: ReadonlyArray<NewTraceMutation_newTrace_currentFailures>;
}

export interface NewTraceMutation {
  readonly newTrace: NewTraceMutation_newTrace;
}

export interface NewTraceMutationVariables {
  readonly input: NewTraceInput;
}
