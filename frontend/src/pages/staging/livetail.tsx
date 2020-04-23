import { LiveTail } from "../../components/live_tail/live_tail";
import React, { useState } from "react";

const data = `
Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
    `;

function genererateRandomChunks<T>(arr: T[], maxChunkSize: number): T[][] {
    let cursor = 0;
    let result: T[][] = [];
    while (cursor < arr.length) {
        let inc = Math.ceil(Math.random() * maxChunkSize);
        let nextCursor = Math.min(arr.length, inc + cursor);
        let chunk: T[] = [];
        while (cursor < nextCursor) {
            chunk.push(arr[cursor]);
            cursor += 1;
        }
        result.push(chunk);
    }
    return result;
}

export default function LiveTailWithData() {
    const [rawData, setRawData] = useState(data);

    let lines = genererateRandomChunks(rawData.split(/\s/), 20).map((chunk) =>
        chunk.join(" ")
    );

    return (
        <div className="h-screen">
            <LiveTail logs={lines} />
            <button onClick={(_) => setRawData(data + rawData)}> Set Data</button>
        </div>
    );
}
