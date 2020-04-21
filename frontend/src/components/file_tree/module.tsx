import React, { useContext } from "react";
import gql from "graphql-tag";
import { ModuleFragment } from "../../generated/ModuleFragment";
import { OnPickContext } from "./on_pick_context";

type LineProps = {
    id: string;
    text: string;
};

function removeNulls<T>(arr: (T | null | undefined)[]): T[] {
    return arr.filter((val) => val !== null && val !== undefined) as T[];
}

// TODO send file and file portion information on the data
function Line({ id, text }: LineProps) {
    const onPick = useContext(OnPickContext);
    return (
        <div
            className="hover:bg-gray-500 cursor-pointer"
            onClick={(_) => onPick && onPick(id)}
        >
            {text}
        </div>
    );
}

export function Module(props: ModuleFragment) {
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
