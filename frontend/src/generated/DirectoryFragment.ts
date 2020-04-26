/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: DirectoryFragment
// ====================================================

export interface DirectoryFragment_subDirectories {
  __typename: "DirectoryInfo";
  id: string;
  name: string;
}

export interface DirectoryFragment_files_classes {
  __typename: "ClassInfo";
  name: string;
}

export interface DirectoryFragment_files_functions {
  __typename: "FunctionInfo";
  name: string;
}

export interface DirectoryFragment_files {
  __typename: "FileInfo";
  id: string;
  name: string;
  classes: DirectoryFragment_files_classes[];
  functions: DirectoryFragment_files_functions[];
}

export interface DirectoryFragment {
  __typename: "DirectoryInfo";
  subDirectories: DirectoryFragment_subDirectories[];
  files: DirectoryFragment_files[];
}
