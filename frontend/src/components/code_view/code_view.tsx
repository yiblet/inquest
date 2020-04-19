import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import { Floater, Position } from "./floater";

export type CodeViewProps = {
    code: string;
    className?: string;
};

export type CodeViewState = {
    position: Position;
};

export type Editor = AceAjax.Editor;

export class CodeView extends React.Component<CodeViewProps, CodeViewState> {
    state = {
        position: null,
    };

    private ref: React.RefObject<AceEditor>;

    constructor(props: CodeViewProps) {
        super(props);
        this.ref = React.createRef();
        this.onMouseMove.bind(this);
    }

    get editor(): Editor | null {
        return (this.ref?.current?.editor as Editor) ?? null;
    }

    onMouseMove = ({ clientX, clientY }: MouseEvent) => {
        this.setState({ position: { left: clientX + 20, top: clientY } });
    };

    componentDidMount() {
        this.editor?.on("mousemove", this.onMouseMove);
    }

    componentWillUnmount() {
        this.editor?.off("mousemove", this.onMouseMove);
    }

    render() {
        const { code } = this.props;
        return (
            <div className="w-full h-full">
                <Floater position={this.state.position}>
                    <div className="w-20 h-20 bg-black"></div>
                </Floater>
                <AceEditor
                    mode="python"
                    ref={this.ref}
                    theme="github"
                    name="code"
                    fontSize="1rem"
                    width="100%"
                    height="100%"
                    highlightActiveLine={false}
                    readOnly={true}
                    value={code}
                    editorProps={{ $blockScrolling: true }}
                    markers={[
                        {
                            startRow: 1,
                            startCol: 1,
                            endRow: 2,
                            endCol: 2,
                            className: "bg-gray-400",
                            type: "text",
                        },
                    ]}
                />
            </div>
        );
    }
}
