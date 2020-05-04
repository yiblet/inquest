import React, { useEffect, useMemo } from "react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import { Editor } from "./utils";
import { NodeRenderer } from "./node_renderer";
import { createLogger } from "../../utils/logger";

const logger = createLogger(["Marker"]);

class ContentWidget implements monacoEditor.editor.IContentWidget {
    public readonly domNode: HTMLElement;
    constructor(private name: string, private line: number) {
        this.domNode = document.createElement("div");
        this.domNode.style.minWidth = "40rem";
    }

    getDomNode() {
        return this.domNode;
    }

    getId() {
        return this.name;
    }

    get height() {
        return this.domNode.offsetHeight;
    }

    getPosition() {
        return {
            position: {
                lineNumber: this.line,
                column: 5,
            },
            range: null,
            preference: [
                monacoEditor.editor.ContentWidgetPositionPreference.BELOW,
            ],
        };
    }
}

export type MarkerProps = {
    id: string;
    line: number;
    visible: boolean;
    editor: Editor;
    children: React.ReactElement;
};

/**
 * Maintains the state of each marker
 */
export const Marker: React.FC<MarkerProps> = ({
    id,
    line,
    editor,
    children,
    visible,
}) => {
    const contentWidget = useMemo(() => {
        return new ContentWidget(id, line);
    }, [id, line, editor]);

    logger.debug(`rerender visibility=${visible}`);

    useEffect(() => {
        if (!visible) return;
        editor.addContentWidget(contentWidget);
        return () => {
            editor.removeContentWidget(contentWidget);
        };
    }, [contentWidget, visible, editor]);

    return <NodeRenderer node={contentWidget.domNode}>{children}</NodeRenderer>;
};
