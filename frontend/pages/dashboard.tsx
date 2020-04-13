import "../styles/style.css";
import React from "react";
import { withAuth } from "../services/auth";
import Link from "next/link";

function Dashboard() {
    return (
        <ul>
            <li>
                <Link href={"/"}>
                    <a>Home</a>
                </Link>
            </li>
            <li>
                <Link href={"/login"}>
                    <a>Login</a>
                </Link>
            </li>
            <li>
                <Link href={"/dashboard"}>
                    <a>Dashboard (protected)</a>
                </Link>
            </li>
        </ul>
    );
}

export default withAuth(Dashboard);
