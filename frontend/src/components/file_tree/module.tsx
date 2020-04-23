import React from "react";
import gql from "graphql-tag";
import { ModuleFragment } from "../../generated/ModuleFragment";

function removeNulls<T>(arr: (T | null | undefined)[]): T[] {
    return arr.filter((val) => val !== null && val !== undefined) as T[];
}

export type ModuleProps = {
    line: React.ComponentType<{ id: string; text: string }>;
} & ModuleFragment;

export function Module(props: ModuleProps) {
    const Line = props.line;
    return (
        <div>
            <Line text={props.name} id={props.file.id} />
            <div className="pl-4">
                {removeNulls(props.subModules).map((mod) => (
                    <Line text={mod.name} id={mod.name} key={mod.name} />
                ))}
            </div>
        </div>
    );
}

Module.fragment = gql`
    fragment ModuleFragment on Module {
        name
        file {
            id
        }
        subModules {
            name
        }
        childClasses {
            name
        }
        childFunctions {
            name
        }
    }
`;
