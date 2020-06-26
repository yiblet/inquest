import { gql, useSubscription } from "@apollo/client";
import { LiveTailSubscription } from "../generated/LiveTailSubscription";
import React, { useState, useEffect, useCallback } from "react";
import { LiveTail } from "../components/live_tail/live_tail";
import { List } from "immutable";

const LIVE_TAIL_SUBSCRIPTION = gql`
    subscription LiveTailSubscription($traceSetId: String!) {
        listenLog(traceSetId: $traceSetId)
    }
`;

/**
 * shows the user's live tail
 */
export const LiveTailConnector: React.FC<{ traceSetId: string }> = ({
    traceSetId,
}) => {
    const { data } = useSubscription<LiveTailSubscription>(
        LIVE_TAIL_SUBSCRIPTION,
        {
            variables: { traceSetId },
        }
    );

    const [logs, setLogs] = useState<List<string>>(List());
    useEffect(() => {
        data?.listenLog && setLogs((logs) => logs.push(...data.listenLog));
    }, [data?.listenLog, setLogs]);
    const clearLogs = useCallback(() => setLogs(() => List()), [logs, setLogs]);

    return <LiveTail logs={logs} clearLogs={clearLogs} />;
};
