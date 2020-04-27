/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SubdirectoryQuery
// ====================================================

export interface SubdirectoryQuery_directory_subDirectories {
  readonly __typename: "DirectoryInfo";
  readonly id: string;
  readonly name: string;
}

export interface SubdirectoryQuery_directory_files_classes {
  readonly __typename: "ClassInfo";
  readonly name: string;
}

export interface SubdirectoryQuery_directory_files_functions {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface SubdirectoryQuery_directory_files {
  readonly __typename: "FileInfo";
  readonly id: string;
  readonly name: string;
  readonly classes: ReadonlyArray<SubdirectoryQuery_directory_files_classes>;
  readonly functions: ReadonlyArray<SubdirectoryQuery_directory_files_functions>;
}

export interface SubdirectoryQuery_directory {
  readonly __typename: "DirectoryInfo";
  readonly subDirectories: ReadonlyArray<SubdirectoryQuery_directory_subDirectories>;
  readonly files: ReadonlyArray<SubdirectoryQuery_directory_files>;
}

export interface SubdirectoryQuery {
  readonly directory: SubdirectoryQuery_directory | null;
}

export interface SubdirectoryQueryVariables {
  readonly directoryId: string;
}
