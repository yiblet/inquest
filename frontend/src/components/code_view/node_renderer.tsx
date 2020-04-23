import React, { useEffect } from "react";
import ReactDOM from "react-dom";

interface NodeRendererProps {
    node: HTMLElement;
    children: React.ReactElement;
}

/**
 * RefRenderer
 * utility class to let react render components and pass things down to the children
 */
export const NodeRenderer = ({ node, children }: NodeRendererProps) => {
    // this will unmount the component if we switch nodes
    useEffect(() => {
        return () => {
            ReactDOM.unmountComponentAtNode(node);
        };
    }, [node]);
    useEffect(() => {
        ReactDOM.render(children, node);
    }, [node, children]);
    // always render the children however
    return <></>;
};
