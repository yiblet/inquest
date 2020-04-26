import React from "react";
import { Module, ModuleProps } from "./module";

export function Line({
    text,
    highlight,
    onClick,
}: {
    text: string;
    highlight?: boolean;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => any;
}) {
    let className = "hover:bg-gray-500 cursor-pointer";
    if (highlight) className = className + " bg-gray-400";
    return (
        <div className={className} onClick={onClick}>
            {text}
        </div>
    );
}

export function FileTree(props: ModuleProps) {
    return (
        <div>
            <div className="text-md font-semibold text-gray-800">Modules</div>
            <Module {...props} />
        </div>
    );
}
