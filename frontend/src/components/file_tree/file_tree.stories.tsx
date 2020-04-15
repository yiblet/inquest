import React from "react";
import { Button } from "@storybook/react/demo";
import { FileTree } from "./file_tree";

export default { title: "FileTree" };

export const StandardView = () => <FileTree />;

export const withText = () => <Button>Hello Button</Button>;

export const withEmoji = () => (
    <Button>
        <span role="img" aria-label="so cool">
            😀 😎 👍 💯
        </span>
    </Button>
);
