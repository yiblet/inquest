/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: NewTrace
// ====================================================

export interface NewTrace_newTrace_function {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface NewTrace_newTrace_traceSet {
  readonly __typename: "TraceSet";
  readonly id: string;
}

export interface NewTrace_newTrace {
  readonly __typename: "Trace";
  readonly function: NewTrace_newTrace_function | null;
  readonly statement: string;
  readonly traceSet: NewTrace_newTrace_traceSet;
}

export interface NewTrace {
  readonly newTrace: NewTrace_newTrace;
}

export interface NewTraceVariables {
  readonly functionId: string;
  readonly statement: string;
  readonly id: string;
  readonly line: number;
}
