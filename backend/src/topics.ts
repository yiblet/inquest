export function genProbeTopic(traceSetId: string): string {
    return `PROBE:${traceSetId}`;
}

export function genLogTopic(traceSetId: string): string {
    return `LOG:${traceSetId}`;
}
