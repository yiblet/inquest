/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SubdirectoryQuery
// ====================================================

export interface SubdirectoryQuery_directory_subDirectories {
  __typename: "DirectoryInfo";
  id: string;
  name: string;
}

export interface SubdirectoryQuery_directory_files_classes {
  __typename: "ClassInfo";
  name: string;
}

export interface SubdirectoryQuery_directory_files_functions {
  __typename: "FunctionInfo";
  name: string;
}

export interface SubdirectoryQuery_directory_files {
  __typename: "FileInfo";
  id: string;
  name: string;
  classes: SubdirectoryQuery_directory_files_classes[];
  functions: SubdirectoryQuery_directory_files_functions[];
}

export interface SubdirectoryQuery_directory {
  __typename: "DirectoryInfo";
  subDirectories: SubdirectoryQuery_directory_subDirectories[];
  files: SubdirectoryQuery_directory_files[];
}

export interface SubdirectoryQuery {
  directory: SubdirectoryQuery_directory | null;
}

export interface SubdirectoryQueryVariables {
  directoryId: string;
}
