/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: NewTraceWithState
// ====================================================

export interface NewTraceWithState_newTrace_function {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface NewTraceWithState_newTrace_traceSet_desiredSet_function {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface NewTraceWithState_newTrace_traceSet_desiredSet {
  readonly __typename: "Trace";
  readonly function: NewTraceWithState_newTrace_traceSet_desiredSet_function | null;
  readonly statement: string;
}

export interface NewTraceWithState_newTrace_traceSet {
  readonly __typename: "TraceSet";
  readonly id: string;
  /**
   * the desired set according to this traceSet
   */
  readonly desiredSet: ReadonlyArray<NewTraceWithState_newTrace_traceSet_desiredSet>;
}

export interface NewTraceWithState_newTrace {
  readonly __typename: "Trace";
  readonly id: string;
  readonly function: NewTraceWithState_newTrace_function | null;
  readonly statement: string;
  readonly traceSet: NewTraceWithState_newTrace_traceSet;
}

export interface NewTraceWithState {
  readonly newTrace: NewTraceWithState_newTrace;
}

export interface NewTraceWithStateVariables {
  readonly functionId: string;
  readonly statement: string;
  readonly id: string;
  readonly line: number;
}
