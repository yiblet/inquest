import { gql, useSubscription } from "@apollo/client";
import { LiveTailSubscription } from "../generated/LiveTailSubscription";
import { getPublicRuntimeConfig } from "../config";
import React, { useState, useEffect, useCallback } from "react";
import { LiveTail } from "../components/live_tail/live_tail";
import { List } from "immutable";

const LIVE_TAIL_SUBSCRIPTION = gql`
    subscription LiveTailSubscription($traceSetId: String!) {
        listenLog(traceSetId: $traceSetId)
    }
`;

export function LiveTailConnector() {
    const { data } = useSubscription<LiveTailSubscription>(
        LIVE_TAIL_SUBSCRIPTION,
        {
            variables: { traceSetId: getPublicRuntimeConfig().traceSet },
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
