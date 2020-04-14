import "../styles/style.css";
import React from "react";
import Link from "next/link";

export default function Index() {
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
