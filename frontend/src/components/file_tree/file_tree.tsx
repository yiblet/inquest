import React from "react";
import { ModuleFragment } from "../../generated/ModuleFragment";
import { Module } from "./module";
import { partial } from "../../utils/partial";

type LineProps = {
    id: string;
    text: string;
    onPick: (fileId: string) => any;
    currentFileId: string | null;
};

function Line({ id, text, onPick, currentFileId }: LineProps) {
    let className = "hover:bg-gray-500 cursor-pointer";
    if (currentFileId === id) className = className + " bg-gray-400";
    return (
        <div className={className} onClick={(_) => onPick && onPick(id)}>
            {text}
        </div>
    );
}

export function FileTree({
    onPick,
    modules,
    currentFileId,
}: {
    onPick: (fileId: string) => any;
    currentFileId: string | null;
    modules: ModuleFragment[];
}) {
    const line = partial(Line, { onPick, currentFileId });
    return (
        <>
            {modules.map((module) => (
                <Module {...module} line={line} key={module.name} />
            ))}
        </>
    );
}
