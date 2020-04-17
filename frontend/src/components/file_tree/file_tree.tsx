import "../../styles/style.css";
import React from "react";
import { ModuleFragment } from "../../generated/ModuleFragment";
import { OnPick, OnPickContext } from "./on_pick_context";
import { Module } from "./module";

export function FileTree({
    onPick,
    modules,
}: {
    onPick: OnPick;
    modules: ModuleFragment[];
}) {
    return (
        <OnPickContext.Provider value={onPick}>
            {modules.map((module) => (
                <Module {...module} key={module.name} />
            ))}
        </OnPickContext.Provider>
    );
}
