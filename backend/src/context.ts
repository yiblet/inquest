import { User, Probe, Organization } from "./entities";
import { PublicError } from "./utils";
import { Logger } from "winston";

export class Context {
    private _organization: Organization | undefined;
    constructor(
        public readonly logger: Logger,
        private _user: User | null,
        private _probe: Probe | null | "new"
    ) {}

    get probe(): Probe {
        if (!this._probe || this._probe === "new")
            throw new PublicError("probe must be logged in");
        return this._probe;
    }

    get user(): User {
        if (!this._user) throw new PublicError("user must be logged in");
        return this._user;
    }

    async organization(): Promise<Organization> {
        // this._orgization is cached if already queried
        if (this._organization) {
            return this._organization;
        }

        let org: Organization;
        if (this._user) {
            org = await this._user.organization;
        } else if (this._probe && this._probe !== "new") {
            org = await (await this._probe.traceSet).organization;
        } else {
            throw new PublicError("must be logged in");
        }
        this._organization = org;
        return org;
    }
}
