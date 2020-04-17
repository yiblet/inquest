import "../../styles/style.css";
import React, { useContext } from "react";
import gql from "graphql-tag";
import { ModuleFragment } from "../../generated/ModuleFragment";
import { OnPickContext } from "./on_pick_context";

export type OnPick = (id: string) => any;

type LineProps = {
    id: string;
    text: string;
};

// TODO send file and file portion information on the data
function Line({ id, text }: LineProps) {
    const onPick = useContext(OnPickContext);
    return (
        <div
            className="hover:bg-gray-500 cursor-pointer"
            onClick={(_) => onPick(id)}
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
                {props.subModules.map((mod) => (
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
