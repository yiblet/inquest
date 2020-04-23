import React, { useRef, useEffect, useState } from "react";
import { List } from "immutable";

function LiveTailLogViewer({
    scrollToBottom,
    logs,
}: {
    logs: List<string>;
    scrollToBottom: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const scrollToBottomEffect = () => {
        if (scrollToBottom) ref.current?.scrollIntoView();
    };
    useEffect(scrollToBottomEffect, [scrollToBottom, logs]);
    if (logs.size === 0) {
        return (
            <div className="h-full p-2 font-mono overflow-y-scroll">
                <div style={{ height: "25%" }}></div>
                <div className="text-center text-3xl text-gray-700 font-bold">
                    No Logs
                </div>
                <div ref={ref} />
            </div>
        );
    }

    return (
        <div className="h-full p-2 font-mono overflow-y-scroll">
            {logs
                .map((value, idx) => (
                    <div className="" key={idx}>
                        {value}
                    </div>
                ))
                .toArray()}
            <div ref={ref} />
        </div>
    );
}

export function LiveTail({ logs }: { logs: List<string> }) {
    const [filter, setFilter] = useState("");
    const [scrollingEnabled, setScrollingEnabled] = useState(false);

    if (filter !== "") {
        logs = logs.filter((text) => text.search(filter) !== -1);
    }

    return (
        <div className="flex flex-col h-full w-full text-sm text-gray-300 bg-gray-900">
            <form className="flex items-center p-2 border-white font-medium text-md border-b">
                Filter:
                <input
                    className="bg-gray-700 mx-2"
                    type="text"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                />
                Auto Scroll To Bottom:
                <input
                    className="bg-gray-700 mx-2"
                    type="checkbox"
                    checked={scrollingEnabled}
                    onChange={(event) =>
                        setScrollingEnabled(event.target.checked)
                    }
                />
            </form>
            <LiveTailLogViewer scrollToBottom={scrollingEnabled} logs={logs} />
        </div>
    );
}
