/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ModuleFragment
// ====================================================

export interface ModuleFragment_file {
  __typename: "File";
  id: string;
}

export interface ModuleFragment_subModules {
  __typename: "Module";
  name: string;
}

export interface ModuleFragment_childClasses {
  __typename: "Class";
  name: string;
}

export interface ModuleFragment_childFunctions {
  __typename: "Function";
  name: string;
}

export interface ModuleFragment {
  __typename: "Module";
  name: string;
  file: ModuleFragment_file;
  subModules: (ModuleFragment_subModules | null)[];
  childClasses: (ModuleFragment_childClasses | null)[];
  childFunctions: (ModuleFragment_childFunctions | null)[];
}
