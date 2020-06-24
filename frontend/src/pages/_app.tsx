import "../styles/style.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import {
    Notifications,
    Notification,
    NotificationContext,
} from "../components/utils/notifications";
import { Observable } from "../utils/observable";
// Prevent fontawesome from adding its CSS since we did it manually above:
import { config } from "@fortawesome/fontawesome-svg-core";
import { gaService } from "../services/ga_service";

config.autoAddCss = false;

function MyApp({ Component, pageProps }) {
    const [observable] = useState<Observable<Notification>>(new Observable());

    useEffect(() => {
        gaService.initialize();
        gaService.logPageView();
    });

    return (
        <NotificationContext.Provider value={observable}>
            <Head>
                <title>
                    Inquest - Get Vision On Your Production Code Instantly
                </title>
                <meta
                    name="title"
                    content="Inquest - Get Vision On Your Production Code Instantly"
                />
                <meta
                    name="description"
                    content="Inquest is the fastest way to monitor your running code. See in seconds what's happening in any line of code. "
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://inquest.dev/" />
                <meta
                    property="og:title"
                    content="Inquest - Get Vision On Your Production Code Instantly"
                />
                <meta
                    property="og:description"
                    content="Inquest is the fastest way to monitor your running code. See in seconds what's happening in any line of code. "
                />
                <meta property="og:image" content="/resources/inquest.png" />
                <link
                    rel="icon"
                    type="image/ico"
                    href="/resources/favicon.ico"
                />
                <link rel="manifest" href="/resources/site.webmanifest" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lato&family=Roboto:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <Notifications />
            <Component {...pageProps} />
        </NotificationContext.Provider>
    );
}

export default MyApp;
