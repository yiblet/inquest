import React from "react";

type Subtract<P, C extends Partial<P>> = {
    [K in Exclude<keyof P, keyof C>]: P[K];
};

function combine<P, C>(part1: C, part2: Subtract<P, C>): P {
    // @ts-ignore (just trust me on this, typescript)
    return { ...part1, ...part2 };
}

/**
 * High order component for partially applying react component variables
 */
export function partial<P, C extends Partial<P>>(
    Comp: React.ComponentType<P>,
    partial: C
) {
    const Partial: React.FC<Subtract<P, C>> = (rest) => {
        const props: P = combine(partial, rest);
        return <Comp {...props} />;
    };
    return Partial;
}
