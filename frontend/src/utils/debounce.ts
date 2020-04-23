type Parameters<T extends (...args: any[]) => any> = T extends (
    ...args: infer P
) => any
    ? P
    : never;

export function debounce<T extends (...args: any[]) => void>(
    func: T,
    waitTime = 250
): (...funcArgs: Parameters<T>) => void {
    let time: number | null = null;
    return (...args: Parameters<T>): void => {
        const now = Date.now();
        if (time === null || now - time > waitTime) {
            time = now;
            func(...args);
        }
    };
}
