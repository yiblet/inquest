/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ModulesQuery
// ====================================================

export interface ModulesQuery_rootModules_file {
  __typename: "File";
  id: string;
}

export interface ModulesQuery_rootModules_subModules {
  __typename: "Module";
  name: string;
}

export interface ModulesQuery_rootModules_childClasses {
  __typename: "Class";
  name: string;
}

export interface ModulesQuery_rootModules_childFunctions {
  __typename: "Function";
  name: string;
}

export interface ModulesQuery_rootModules {
  __typename: "Module";
  name: string;
  file: ModulesQuery_rootModules_file;
  subModules: (ModulesQuery_rootModules_subModules | null)[];
  childClasses: (ModulesQuery_rootModules_childClasses | null)[];
  childFunctions: (ModulesQuery_rootModules_childFunctions | null)[];
}

export interface ModulesQuery {
  rootModules: ModulesQuery_rootModules[];
}
