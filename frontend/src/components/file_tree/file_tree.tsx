import "../../styles/style.css";
import React from "react";

export type ModuleProps = {
    onClick?: (id: string) => any;
    id: string;
    tree?: FileTreeProps;
};

export type FileTreeProps = {
    onClick?: (id: string) => any;
    modules: ModuleProps[];
};

export function Module({ id, onClick, tree }: ModuleProps) {
    const line = (
        <div
            className="bg-white hover:bg-gray-400"
            onClick={(_) => onClick && onClick(id)}
        >
            {id}
        </div>
    );
    if (!tree) return line;

    return (
        <div>
            {line}
            <div className="pl-4">
                <FileTree {...tree} onClick={onClick ?? tree.onClick} />
            </div>
        </div>
    );
}

export function FileTree(props: FileTreeProps) {
    return (
        <div className="flex flex-col">
            {props.modules.map((mod, idx) => (
                <Module
                    {...mod}
                    onClick={props.onClick ?? mod.onClick}
                    key={idx}
                />
            ))}
        </div>
    );
}
