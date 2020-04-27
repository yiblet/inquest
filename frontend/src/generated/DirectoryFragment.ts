/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: DirectoryFragment
// ====================================================

export interface DirectoryFragment_subDirectories {
  readonly __typename: "DirectoryInfo";
  readonly id: string;
  readonly name: string;
}

export interface DirectoryFragment_files_classes {
  readonly __typename: "ClassInfo";
  readonly name: string;
}

export interface DirectoryFragment_files_functions {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface DirectoryFragment_files {
  readonly __typename: "FileInfo";
  readonly id: string;
  readonly name: string;
  readonly classes: ReadonlyArray<DirectoryFragment_files_classes>;
  readonly functions: ReadonlyArray<DirectoryFragment_files_functions>;
}

export interface DirectoryFragment {
  readonly __typename: "DirectoryInfo";
  readonly subDirectories: ReadonlyArray<DirectoryFragment_subDirectories>;
  readonly files: ReadonlyArray<DirectoryFragment_files>;
}
