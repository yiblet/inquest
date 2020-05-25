/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: UserContextQuery
// ====================================================

export interface UserContextQuery_me_organization_traceSets_liveProbes {
  readonly __typename: "Probe";
  readonly id: string;
}

export interface UserContextQuery_me_organization_traceSets_rootDirectory_subDirectories {
  readonly __typename: "DirectoryInfo";
  readonly id: string;
  readonly name: string;
}

export interface UserContextQuery_me_organization_traceSets_rootDirectory_files_classes {
  readonly __typename: "ClassInfo";
  readonly name: string;
}

export interface UserContextQuery_me_organization_traceSets_rootDirectory_files_functions {
  readonly __typename: "FunctionInfo";
  readonly name: string;
}

export interface UserContextQuery_me_organization_traceSets_rootDirectory_files {
  readonly __typename: "FileInfo";
  readonly id: string;
  readonly name: string;
  readonly classes: ReadonlyArray<UserContextQuery_me_organization_traceSets_rootDirectory_files_classes>;
  readonly functions: ReadonlyArray<UserContextQuery_me_organization_traceSets_rootDirectory_files_functions>;
}

export interface UserContextQuery_me_organization_traceSets_rootDirectory {
  readonly __typename: "DirectoryInfo";
  readonly subDirectories: ReadonlyArray<UserContextQuery_me_organization_traceSets_rootDirectory_subDirectories>;
  readonly files: ReadonlyArray<UserContextQuery_me_organization_traceSets_rootDirectory_files>;
}

export interface UserContextQuery_me_organization_traceSets {
  readonly __typename: "TraceSet";
  readonly id: string;
  readonly liveProbes: ReadonlyArray<UserContextQuery_me_organization_traceSets_liveProbes> | null;
  readonly rootDirectory: UserContextQuery_me_organization_traceSets_rootDirectory;
}

export interface UserContextQuery_me_organization {
  readonly __typename: "Organization";
  readonly traceSets: ReadonlyArray<UserContextQuery_me_organization_traceSets>;
}

export interface UserContextQuery_me {
  readonly __typename: "User";
  readonly organization: UserContextQuery_me_organization;
}

export interface UserContextQuery {
  readonly me: UserContextQuery_me | null;
}
