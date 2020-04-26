/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ModulesQuery
// ====================================================

export interface ModulesQuery_rootDirectory_files_classes {
  __typename: "ClassInfo";
  name: string;
}

export interface ModulesQuery_rootDirectory_files_functions {
  __typename: "FunctionInfo";
  name: string;
}

export interface ModulesQuery_rootDirectory_files {
  __typename: "FileInfo";
  id: string;
  name: string;
  classes: ModulesQuery_rootDirectory_files_classes[];
  functions: ModulesQuery_rootDirectory_files_functions[];
}

export interface ModulesQuery_rootDirectory {
  __typename: "DirectoryInfo";
  files: ModulesQuery_rootDirectory_files[];
}

export interface ModulesQuery {
  rootDirectory: ModulesQuery_rootDirectory;
}
