import React, {
    useEffect,
    useMemo,
    useCallback,
    useState,
    useRef,
    useLayoutEffect,
} from "react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import { Editor } from "./utils";
import { NodeRenderer } from "./node_renderer";
import { createLogger } from "../../utils/logger";
import { debounce } from "../../utils/debounce";

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
    name: string;
    line: number;
    visible: boolean;
    editor: Editor;
    children: React.ReactElement;
};

const deleteViewZone = async (editor: Editor, viewZoneId: string) => {
    return await new Promise<void>((resolve) =>
        editor.changeViewZones(
            (changeAccessor: monacoEditor.editor.IViewZoneChangeAccessor) => {
                changeAccessor.removeZone(viewZoneId);
                resolve();
            }
        )
    );
};

const addViewZone = async (
    editor: Editor,
    zone: monacoEditor.editor.IViewZone
) => {
    return await new Promise<string>((resolve) => {
        editor.changeViewZones((changeAccessor) => {
            resolve(changeAccessor.addZone(zone));
        });
    });
};

/**
 * Maintains the state of each marker
 */
export const Marker: React.FC<MarkerProps> = ({
    name,
    line,
    editor,
    children,
    visible,
}) => {
    const state = useMemo(() => {
        const domNode = document.createElement("div");
        domNode.className = "bg-green-200";
        const contentWidget = new ContentWidget(name, line);
        return {
            domNode,
            contentWidget,
        };
    }, [name, line, editor]);

    logger.debug(`rerender visibility=${visible}`);

    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (!visible) return;
        editor.addContentWidget(state.contentWidget);
        return () => {
            editor.removeContentWidget(state.contentWidget);
        };
    }, [visible, editor]);


    useEffect(() => {
        if (!visible) return;
        logger.debug(`view zone created height=${height}`);
        const viewZoneId = addViewZone(editor, {
            afterLineNumber: line,
            heightInPx: height,
            domNode: state.domNode,
        });
        return () => {
            logger.debug("view zone deleting");
            viewZoneId.then((id) => deleteViewZone(editor, id));
        };
    }, [height, visible, editor]);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            debounce(() => {
                setHeight(state.contentWidget.height);
            }, 100);
        });
        observer.observe(state.contentWidget.domNode, {
            subtree: true,
            childList: true,
            attributes: true,
        });
        return observer.disconnect;
    }, [setHeight]);

    return (
        <NodeRenderer node={state.contentWidget.domNode}>
            <div ref={ref}>{children}</div>
        </NodeRenderer>
    );
};
