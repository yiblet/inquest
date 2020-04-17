import React from "react";
import dynamic from "next/dynamic";

const AceEditor = dynamic(
    async () => {
        const ace = await import("react-ace");
        // ace needs to be imported before ace/builds
        await Promise.all([
            import("ace-builds/src-noconflict/mode-python"),
            import("ace-builds/src-noconflict/theme-github"),
        ]);
        return ace;
    },
    {
        ssr: false,
    }
);

export type CodeViewProps = {
    code: string;
    className?: string;
};

export class CodeView extends React.Component<CodeViewProps> {
    render() {
        const { code } = this.props;
        return (
            <div className="w-full h-full">
                <AceEditor
                    mode="python"
                    theme="github"
                    name="code"
                    fontSize="1rem"
                    width="100%"
                    height="100%"
                    highlightActiveLine={false}
                    readOnly={true}
                    value={code}
                    editorProps={{ $blockScrolling: true }}
                />
            </div>
        );
    }
}
