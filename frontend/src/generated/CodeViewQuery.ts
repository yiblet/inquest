/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CodeViewQuery
// ====================================================

export interface CodeViewQuery_file_module_childFunctions_traces {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
}

export interface CodeViewQuery_file_module_childFunctions {
  __typename: "Function";
  name: string;
  traces: CodeViewQuery_file_module_childFunctions_traces[];
}

export interface CodeViewQuery_file_module_childClasses_methods_traces {
  __typename: "Trace";
  id: string;
  statement: string;
  active: boolean;
}

export interface CodeViewQuery_file_module_childClasses_methods {
  __typename: "Function";
  name: string;
  traces: CodeViewQuery_file_module_childClasses_methods_traces[];
}

export interface CodeViewQuery_file_module_childClasses {
  __typename: "Class";
  name: string;
  methods: CodeViewQuery_file_module_childClasses_methods[];
}

export interface CodeViewQuery_file_module {
  __typename: "Module";
  name: string;
  childFunctions: CodeViewQuery_file_module_childFunctions[];
  childClasses: CodeViewQuery_file_module_childClasses[];
}

export interface CodeViewQuery_file {
  __typename: "File";
  name: string;
  content: string;
  module: CodeViewQuery_file_module | null;
}

export interface CodeViewQuery {
  file: CodeViewQuery_file | null;
}

export interface CodeViewQueryVariables {
  fileId: string;
}
