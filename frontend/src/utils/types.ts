import React from "react";
// eslint: disable=all
export type PropsOf<
    F extends React.ComponentType<any>
> = F extends React.ComponentType<infer P> ? P : never;

export type Dictionary<V> = { [key: string]: V };
export type SparseArray<V> = { [key: number]: V };
