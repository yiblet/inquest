/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: FileTreeFragment
// ====================================================

export interface FileTreeFragment_rootDirectory_subDirectories {
  readonly __typename: "DirectoryInfo";
  readonly id: string;
  readonly name: string;
}

export interface FileTreeFragment_rootDirectory_files_classes {
  readonly __typename: "ClassInfo";
  readonly name: string;
}

export interface FileTreeFragment_rootDirectory_files_functions {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface FileTreeFragment_rootDirectory_files {
  readonly __typename: "FileInfo";
  readonly id: string;
  readonly name: string;
  readonly classes: ReadonlyArray<FileTreeFragment_rootDirectory_files_classes>;
  readonly functions: ReadonlyArray<FileTreeFragment_rootDirectory_files_functions>;
}

export interface FileTreeFragment_rootDirectory {
  readonly __typename: "DirectoryInfo";
  readonly subDirectories: ReadonlyArray<FileTreeFragment_rootDirectory_subDirectories>;
  readonly files: ReadonlyArray<FileTreeFragment_rootDirectory_files>;
}

export interface FileTreeFragment {
  readonly __typename: "TraceSet";
  readonly rootDirectory: FileTreeFragment_rootDirectory;
}
