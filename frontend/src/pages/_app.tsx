import "../styles/style.css";
import React, { useState } from "react";
import Head from "next/head";
import {
    Notifications,
    Notification,
    NotificationContext,
} from "../components/utils/notifications";
import { Observable } from "../utils/observable";

function MyApp({ Component, pageProps }) {
    const [observable] = useState<Observable<Notification>>(new Observable());

    return (
        <NotificationContext.Provider value={observable}>
            <Head>
                <script src="https://kit.fontawesome.com/8dccff474a.js" />
            </Head>
            <Notifications />
            <Component {...pageProps} />
        </NotificationContext.Provider>
    );
}

export default MyApp;
