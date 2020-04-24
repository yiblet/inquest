import { User, Probe } from "./entities";
import { PublicError } from "./utils";

export type Context = {
    user?: User;
    probe?: Probe;
};

export function retrieveProbe(context: Context): Probe {
    if (!context.probe) throw new PublicError("probe must be logged in");
    return context.probe;
}
