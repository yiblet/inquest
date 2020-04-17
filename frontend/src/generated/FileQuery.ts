/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: FileQuery
// ====================================================

export interface FileQuery_file {
  __typename: "File";
  name: string;
  content: string;
}

export interface FileQuery {
  file: FileQuery_file | null;
}

export interface FileQueryVariables {
  fileId: string;
}
