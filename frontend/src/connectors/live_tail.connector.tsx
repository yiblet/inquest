import { gql, useSubscription } from "@apollo/client";
import { LiveTailSubscription } from "../generated/LiveTailSubscription";
import { config } from "../config";
import React, { useState, useEffect, useCallback } from "react";
import { LiveTail } from "../components/live_tail/live_tail";
import { List } from "immutable";

const LIVE_TAIL_SUBSCRIPTION = gql`
    subscription LiveTailSubscription($traceSetKey: String!) {
        listenLog(traceSetKey: $traceSetKey)
    }
`;

export function LiveTailConnector() {
    const { data } = useSubscription<LiveTailSubscription>(
        LIVE_TAIL_SUBSCRIPTION,
        {
            variables: { traceSetKey: config.traceSet },
        }
    );

    const [logs, setLogs] = useState<List<string>>(List());
    useEffect(() => {
        data?.listenLog && setLogs((logs) => logs.push(data.listenLog));
    }, [data?.listenLog, setLogs]);
    const clearLogs = useCallback(() => setLogs((logs) => List()), [
        logs,
        setLogs,
    ]);

    return <LiveTail logs={logs} clearLogs={clearLogs} />;
}
