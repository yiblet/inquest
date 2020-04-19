function* allMatches(regex: RegExp, code: string) {
    for (
        let matches = regex.exec(code);
        matches !== null;
        matches = regex.exec(code)
    ) {
        yield matches;
    }
}

export class CodeParser {
    private functionRegex = /^def ([a-zA-Z0-9_]+)/gm;
    private classRegex = /^class ([a-zA-Z0-9_]+)/gm;
    public readonly newLineIdxs: ReadonlyArray<number>;

    constructor(public readonly code: string) {
        this.code = code;
        this.newLineIdxs = Array.from(this.newLines());
    }

    private *newLines() {
        let position = 0;
        while (position >= 0) {
            const newPosition = this.code.indexOf("\n", position);
            if (newPosition >= 0) yield newPosition;
            else {
                break;
            }
            position = newPosition + 1;
        }
    }

    findLine(index: number) {
        const offset = 2;
        let lo = 0; // inclusive
        let hi = this.newLineIdxs.length - 1; // exclusive
        if (index < this.newLineIdxs[lo]) return 1; // index is on the first line
        if (index >= this.newLineIdxs[hi]) return hi + offset; // index is on the last line

        while (hi - lo > 1) {
            const mid = Math.floor((hi + lo) / 2);
            if (index >= this.newLineIdxs[mid]) {
                lo = mid;
            } else {
                hi = mid;
            }
        }

        return lo + offset;
    }

    findPosition(index: number) {
        const row = this.findLine(index);
        let col: number | null;
        if (row === 1) {
            col = index;
        } else {
            col = index - this.newLineIdxs[row] - 1;
        }
        if (col < 0) col = null;
        return {
            row,
            col,
        };
    }

    findFunctions() {
        return Array.from(this.findFunctionsIterator());
    }

    private *findFunctionsIterator() {
        this.functionRegex.lastIndex = 0;
        for (const matches of allMatches(this.functionRegex, this.code)) {
            yield {
                name: matches[1],
                line: this.findLine(matches.index),
            };
        }
    }

    findClasses() {
        return Array.from(this.findClassesIterator());
    }

    private *findClassesIterator() {
        this.classRegex.lastIndex = 0;
        for (const classMatch of allMatches(this.classRegex, this.code)) {
            const methodRegex = /^[ \t]+(async )?def ([a-zA-Z0-9_]+)/gm;
            const root = /\n[a-zA-Z0-9_]+/gm;
            methodRegex.lastIndex = classMatch.index;
            root.lastIndex = classMatch.index + 1;
            const endOfClass: number =
                root.exec(this.code)?.index ?? this.code.length - 1;
            const methods: { name: string; line: number }[] = [];

            for (const methodMatch of allMatches(methodRegex, this.code)) {
                if (methodMatch.index >= endOfClass) continue;
                methods.push({
                    name: methodMatch[2].toString(),
                    line: this.findLine(methodMatch.index),
                });
            }

            yield {
                name: classMatch[1],
                line: this.findLine(classMatch.index),
                methods,
            };
        }
    }
}
