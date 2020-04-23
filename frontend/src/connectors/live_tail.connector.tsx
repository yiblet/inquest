import { gql, useSubscription } from "@apollo/client";
import { LiveTailSubscription } from "../generated/LiveTailSubscription";
import { config } from "../config";
import React, { useState } from "react";
import { LiveTail } from "../components/live_tail/live_tail";

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

    const [logs, setLogs] = useState<string[]>([]);
    if (data) setLogs((logs) => [...logs, data.listenLog]);
    return <LiveTail logs={logs} />;
}
