import React from "react";
import { TraceCreator } from "../../components/code_view/traces";

const Creator: React.FC = () => (
    <div className="w-full my-50">
        <TraceCreator onCreate={console.log} />
    </div>
);

export default Creator;
