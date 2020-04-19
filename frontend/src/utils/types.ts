// eslint: disable=all
export type PropsOf<
    F extends React.ComponentType<any>
> = F extends React.ComponentType<infer P> ? P : never;
