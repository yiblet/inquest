import { User, Probe } from "./entities";

export type Context = {
    user?: User;
    probe?: Probe;
};
