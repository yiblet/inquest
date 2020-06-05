import * as ReactGA from "react-ga";

class GAService {
    public readonly ga: typeof ReactGA;
    constructor() {
        this.ga = ReactGA;
    }

    initialize() {
        this.ga.initialize("UA-78950781-7");
    }

    logPageView() {
        this.ga.set({ page: window.location.pathname });
        this.ga.pageview(window.location.pathname);
    }

    wrapWithGa<T, R>(
        func: (value: T) => R,
        extractor: (value: T) => string,
        category = "user"
    ): (value: T) => R {
        return (value: T) => {
            this.ga.event({
                category,
                action: extractor(value),
            });
            return func(value);
        };
    }
}

export const gaService = new GAService();
