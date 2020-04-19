import React from "react";

export type FloaterProps = {
    className?: string;
    position: Position;
};

export type Position = {
    left: number;
    top: number;
} | null;

export const Floater: React.FunctionComponent<FloaterProps> = ({
    position,
    className,
    children,
}) => {
    const classes = ["absolute z-40"];
    if (className) classes.push(className);
    let style = {};
    if (position != null) {
        style = { ...position };
    }
    return (
        <div className={classes.join(" ")} style={style}>
            {children}
        </div>
    );
};
