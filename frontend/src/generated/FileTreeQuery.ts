/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: FileTreeQuery
// ====================================================

export interface FileTreeQuery_rootDirectory_subDirectories {
  readonly __typename: "DirectoryInfo";
  readonly id: string;
  readonly name: string;
}

export interface FileTreeQuery_rootDirectory_files_classes {
  readonly __typename: "ClassInfo";
  readonly name: string;
}

export interface FileTreeQuery_rootDirectory_files_functions {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface FileTreeQuery_rootDirectory_files {
  readonly __typename: "FileInfo";
  readonly id: string;
  readonly name: string;
  readonly classes: ReadonlyArray<FileTreeQuery_rootDirectory_files_classes>;
  readonly functions: ReadonlyArray<FileTreeQuery_rootDirectory_files_functions>;
}

export interface FileTreeQuery_rootDirectory {
  readonly __typename: "DirectoryInfo";
  readonly subDirectories: ReadonlyArray<FileTreeQuery_rootDirectory_subDirectories>;
  readonly files: ReadonlyArray<FileTreeQuery_rootDirectory_files>;
}

export interface FileTreeQuery {
  readonly rootDirectory: FileTreeQuery_rootDirectory;
}
