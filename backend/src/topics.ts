export function genProbeTopic(traceSetKey: string): string {
    return `PROBE:${traceSetKey}`;
}

export function genLogTopic(traceSetKey: string): string {
    return `LOG:${traceSetKey}`;
}
