/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteTrace
// ====================================================

export interface DeleteTrace_deleteTrace_function {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface DeleteTrace_deleteTrace_traceSet_desiredSet_function {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface DeleteTrace_deleteTrace_traceSet_desiredSet {
  readonly __typename: "Trace";
  readonly function: DeleteTrace_deleteTrace_traceSet_desiredSet_function | null;
  readonly statement: string;
}

export interface DeleteTrace_deleteTrace_traceSet {
  readonly __typename: "TraceSet";
  readonly id: string;
  /**
   * the desired set according to this traceSet
   */
  readonly desiredSet: ReadonlyArray<DeleteTrace_deleteTrace_traceSet_desiredSet>;
}

export interface DeleteTrace_deleteTrace {
  readonly __typename: "Trace";
  readonly id: string;
  readonly function: DeleteTrace_deleteTrace_function | null;
  readonly statement: string;
  readonly traceSet: DeleteTrace_deleteTrace_traceSet;
}

export interface DeleteTrace {
  readonly deleteTrace: DeleteTrace_deleteTrace;
}

export interface DeleteTraceVariables {
  readonly id: string;
}
