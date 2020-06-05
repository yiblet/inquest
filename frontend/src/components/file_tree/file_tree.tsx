import React from "react";
import { Module, ModuleProps } from "./module";

export const Line: React.FC<{
    highlight?: boolean;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => any;
}> = ({ children, highlight, onClick }) => {
    let className = "hover:bg-gray-500 cursor-pointer my-1";
    if (highlight) className = className + " bg-gray-400";
    return (
        <div className={className} onClick={onClick}>
            {children}
        </div>
    );
};

export function FileTree(props: ModuleProps) {
    return (
        <div>
            <div className="pl-2 text-md font-semibold text-gray-800">
                Modules
            </div>
            <Module {...props} />
        </div>
    );
}
