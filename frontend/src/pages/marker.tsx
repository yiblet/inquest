import React from "react";

export function TraceViewer() {
    return (
        <form>
            <div className="inline-block my-2 p-1 mr-2 font-mono placeholder-black">
                <span className="text-green-700">logging "</span>
                {"hello {test}"}
                <span className="text-green-700">"</span>
            </div>
            <button className="font-semibold text-black p-1 rounded mr-2">
                edit
            </button>
            <button className="font-semibold text-red-700 text-black p-1 rounded mr-2">
                delete
            </button>
        </form>
    );
}

export function TraceEditor() {
    return (
        <form>
            <input
                className="my-2 p-1 mr-2 bg-green-300 placeholder-black"
                type="email"
                name="email"
                required
                placeholder="new log string"
            />
            <button className="bg-yellow-500 text-white p-1 rounded mr-2">
                modify
            </button>
            <button className="font-semibold text-black p-1 rounded mr-2">
                back
            </button>
        </form>
    );
}

export function TraceCreator() {
    return (
        <form>
            <input
                className="my-2 p-1 mr-2 bg-green-300 placeholder-black"
                type="email"
                name="email"
                required
                placeholder="new log string"
            />
            <button className="bg-green-500 text-white p-1 rounded">
                create
            </button>
        </form>
    );
}

export default function Marker() {
    return (
        <div
            className="flex flex-col w-full h-full bg-green-200"
            onClick={(_) => console.log("click!")}
        >
            <TraceViewer />
            <TraceEditor />
            <TraceCreator />
        </div>
    );
}
