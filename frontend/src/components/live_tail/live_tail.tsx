import React, { useRef, useEffect } from "react";

export function LiveTail({ logs }: { logs: string[] }) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView();
    };
    useEffect(scrollToBottom, [logs]);
    if (logs.length === 0) {
        return (
            <div className="p-2 h-full w-full font-mono text-white bg-gray-900 overflow-y-auto">
                <div style={{ height: "25%" }}></div>
                <div className="text-center text-3xl text-gray-700 font-bold">
                    No Logs Currently
                </div>
                <div ref={messagesEndRef} />
            </div>
        );
    }

    return (
        <div className="p-2 h-full w-full font-mono text-gray-300 bg-gray-900 overflow-y-auto">
            {logs.map((value, idx) => (
                <div className="mb-4" key={idx}>
                    {value}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}
