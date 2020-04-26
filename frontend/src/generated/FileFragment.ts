/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: FileFragment
// ====================================================

export interface FileFragment_classes {
  __typename: "ClassInfo";
  name: string;
}

export interface FileFragment_functions {
  __typename: "FunctionInfo";
  name: string;
}

export interface FileFragment {
  __typename: "FileInfo";
  id: string;
  name: string;
  classes: FileFragment_classes[];
  functions: FileFragment_functions[];
}
