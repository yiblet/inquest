import "../../styles/style.css";
import React from "react";
import { Floater } from "./floater";

export default { title: "stories" };

export const TestFloater = () => {
    return (
        <div className="relative" style={{ width: 500, height: 500 }}>
            <Floater position={{ left: 200, top: 5 }}>
                <div className="w-20 h-20 bg-black"></div>
            </Floater>
        </div>
    );
};

export const MarkerComponent: React.FunctionComponent = () => {
    return (
        <div
            className="w-full h-full bg-green-200"
            onClick={(_) => console.log("click!")}
        >
            Testing Testing
        </div>
    );
};
