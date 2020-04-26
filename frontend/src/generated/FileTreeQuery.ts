/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: FileTreeQuery
// ====================================================

export interface FileTreeQuery_rootDirectory_subDirectories {
  __typename: "DirectoryInfo";
  id: string;
  name: string;
}

export interface FileTreeQuery_rootDirectory_files_classes {
  __typename: "ClassInfo";
  name: string;
}

export interface FileTreeQuery_rootDirectory_files_functions {
  __typename: "FunctionInfo";
  name: string;
}

export interface FileTreeQuery_rootDirectory_files {
  __typename: "FileInfo";
  id: string;
  name: string;
  classes: FileTreeQuery_rootDirectory_files_classes[];
  functions: FileTreeQuery_rootDirectory_files_functions[];
}

export interface FileTreeQuery_rootDirectory {
  __typename: "DirectoryInfo";
  subDirectories: FileTreeQuery_rootDirectory_subDirectories[];
  files: FileTreeQuery_rootDirectory_files[];
}

export interface FileTreeQuery {
  rootDirectory: FileTreeQuery_rootDirectory;
}
