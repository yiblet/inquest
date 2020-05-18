import { User, Probe, Organization } from "./entities";
import { PublicError } from "./utils";

export class Context {
    private _organization: Organization | undefined;
    constructor(private _user?: User, private _probe?: Probe) {}

    get probe(): Probe {
        if (!this.probe) throw new PublicError("probe must be logged in");
        return this.probe;
    }

    get user(): User {
        if (!this.user) throw new PublicError("user must be logged in");
        return this.user;
    }

    async organization(): Promise<Organization> {
        // this._orgization is cached if already queried
        if (this._organization) {
            return this._organization;
        }

        let org: Organization;
        if (this._user) {
            org = await this._user.organization;
        } else if (this._probe) {
            org = await (await this._probe.traceSet).organization;
        } else {
            throw new PublicError("must be logged in");
        }
        this._organization = org;
        return org;
    }
}
