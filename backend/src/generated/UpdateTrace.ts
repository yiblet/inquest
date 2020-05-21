/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateTrace
// ====================================================

export interface UpdateTrace_updateTrace_function {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface UpdateTrace_updateTrace_traceSet_desiredSet_function {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface UpdateTrace_updateTrace_traceSet_desiredSet {
  readonly __typename: "Trace";
  readonly function: UpdateTrace_updateTrace_traceSet_desiredSet_function | null;
  readonly statement: string;
}

export interface UpdateTrace_updateTrace_traceSet {
  readonly __typename: "TraceSet";
  readonly id: string;
  /**
   * the desired set according to this traceSet
   */
  readonly desiredSet: ReadonlyArray<UpdateTrace_updateTrace_traceSet_desiredSet>;
}

export interface UpdateTrace_updateTrace {
  readonly __typename: "Trace";
  readonly id: string;
  readonly function: UpdateTrace_updateTrace_function | null;
  readonly statement: string;
  readonly traceSet: UpdateTrace_updateTrace_traceSet;
}

export interface UpdateTrace {
  readonly updateTrace: UpdateTrace_updateTrace;
}

export interface UpdateTraceVariables {
  readonly statement?: string | null;
  readonly active?: boolean | null;
  readonly id: string;
}
