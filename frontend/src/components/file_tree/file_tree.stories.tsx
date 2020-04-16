import React from "react";
import { FileTree } from "./file_tree";

export default { title: "FileTree" };

const standardViewProps = {
    modules: [
        { id: "test" },
        {
            id: "haha",
            tree: {
                modules: [{ id: "test" }, { id: "string" }],
            },
        },
        { id: "string" },
    ],
    onClick: console.log,
};
export const StandardView = () => <FileTree {...standardViewProps} />;
