import React from "react";
import Prism from "prismjs";

export type CodeViewProps = {
    code: string;
};

export class CodeView extends React.Component<CodeViewProps> {
    private ref: React.RefObject<HTMLElement>;

    constructor(props: CodeViewProps) {
        super(props);
        this.ref = React.createRef();
    }

    componentDidMount() {
        this.highlight();
    }

    componentDidUpdate() {
        this.highlight();
    }

    highlight = () => {
        if (this.ref && this.ref.current) {
            Prism.highlightElement(this.ref.current);
        }
    };

    render() {
        const { code } = this.props;
        return (
            <pre className={"line-numbers"}>
                <code ref={this.ref} className={`language-python`}>
                    {code.trim()}
                    <div>
                        <span>Test Code</span>
                    </div>
                </code>
            </pre>
        );
    }
}
