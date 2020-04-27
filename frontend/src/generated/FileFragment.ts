/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: FileFragment
// ====================================================

export interface FileFragment_classes {
  readonly __typename: "ClassInfo";
  readonly name: string;
}

export interface FileFragment_functions {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface FileFragment {
  readonly __typename: "FileInfo";
  readonly id: string;
  readonly name: string;
  readonly classes: ReadonlyArray<FileFragment_classes>;
  readonly functions: ReadonlyArray<FileFragment_functions>;
}
