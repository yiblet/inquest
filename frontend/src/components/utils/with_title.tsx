import Head from "next/head";
import React from "react";

export const WithTitle: React.FC<{ title: string }> = ({ title, children }) => (
    <>
        <Head>
            <title> {title} </title>
        </Head>
        {children}
    </>
);
