import React from "react";
import { withAuth } from "../utils/auth";
import { NextPageContext } from "next";

function Index() {
    return <></>;
}

Index.getInitialProps = ({ res }: NextPageContext) => {
    if (res) {
        res.writeHead(301, {
            Location: "/dashboard",
        });
        res.end();
    }
    return {};
};

export default withAuth(Index);
