import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getGetStartedDocsURL } from "../../utils/protocol";
import { PropsOf } from "../../utils/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faHeart } from "@fortawesome/free-solid-svg-icons";
import { useLoggedInState } from "../../utils/auth";

const Login: React.FC<{ borderColor: string }> = ({ borderColor }) => {
    const loggedIn = useLoggedInState();
    return loggedIn ? (
        <Link href="/dashboard">
            <button className={`mr-4 px-4 rounded border ${borderColor}`}>
                Dashboard
            </button>
        </Link>
    ) : (
        <Link href="/login">
            <button className={`mr-4 px-4 rounded border ${borderColor}`}>
                Login
            </button>
        </Link>
    );
};

export const Footnotes: React.FC = () => {
    return (
        <section id="footnotes" className="">
            <div className="container mx-auto py-8 text-lg text-blue-900">
                <div className="flex-grow text-center mb-4">
                    <p>
                        Made With{" "}
                        <FontAwesomeIcon
                            className="text-red-500"
                            icon={faHeart}
                        />{" "}
                        In San Francisco
                    </p>
                </div>
                <div className="text-center md:text-right">
                    <Link href="/privacy_policy">
                        <a href="/privacy_policy" className="mr-4">
                            Privacy Policy
                        </a>
                    </Link>
                    <Link href="/terms_of_service">
                        <a href="/terms_of_service">Terms of Service</a>
                    </Link>
                </div>
            </div>
        </section>
    );
};

/**
 * find's out if an html element is in the viewport
 * https://stackoverflow.com/questions/123999/how-can-i-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
 */
function inViewport(el: HTMLElement) {
    if (!el || 1 !== el.nodeType) {
        return false;
    }
    const html = document.documentElement;
    const r = el.getBoundingClientRect();

    return (
        !!r &&
        r.bottom >= 0 &&
        r.right >= 0 &&
        r.top <= html.clientHeight &&
        r.left <= html.clientWidth
    );
}

export const Navbar: React.FC<{ light?: boolean }> = ({ light }) => {
    const [mobileVisible, setMobileVisible] = useState(false);

    let borderColor = "border-black";
    let textColor = "text-black";
    if (light) {
        borderColor = "border-white";
        textColor = "text-white";
    }

    const toggleMobileVisible = useCallback(
        () => setMobileVisible((val) => !val),
        [setMobileVisible]
    );

    return (
        <>
            <div
                className={`mt-4 px-4 flex sm:hidden justify-between ${textColor}`}
            >
                <div className="logo uppercase text-2xl">
                    <Link href="/">
                        <a href="/">Inquest</a>
                    </Link>
                </div>
                <button
                    className={`float-right px-4 rounded border ${borderColor}`}
                    onClick={toggleMobileVisible}
                >
                    <FontAwesomeIcon icon={faBars} />
                </button>
            </div>
            <div
                className={`px-4 pb-4 sm:py-0 sm:flex flex-col sm:flex-row justify-center md:justify-between text-left items-baseline text-lg tracking-wider ${textColor} ${
                    mobileVisible ? "shadow-lg sm:shadow-none" : ""
                }`}
            >
                <div className="hidden md:block logo uppercase text-2xl">
                    <Link href="/">
                        <a href="/">Inquest</a>
                    </Link>
                </div>
                <div
                    className={`sm:flex sm:flex-row 
                    ${mobileVisible ? "grid grid-cols-1 gap-1" : "hidden"}`}
                >
                    <a className="mr-6" href={getGetStartedDocsURL()}>
                        Docs
                    </a>
                    <a className="mr-6" href="/#features">
                        Features
                    </a>
                    <div>
                        <Login borderColor={borderColor} />
                    </div>
                </div>
            </div>
        </>
    );
};

export const ScrollingNavbar: React.FC<PropsOf<typeof Navbar>> = (props) => {
    const ref = useRef<HTMLDivElement>(null);
    const [fixed, setFixed] = useState(false);

    useEffect(() => {
        const handler = () => {
            if (!ref.current) return;
            setFixed(!inViewport(ref.current));
        };

        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, [ref]);

    return (
        <div ref={ref} className={"sm:h-16 flex items-center w-full"}>
            <div
                className={
                    fixed
                        ? "bg-white fixed top-0 left-0 shadow-md sm:h-16 w-full flex items-center"
                        : "bg-white w-full"
                }
            >
                <div className="container mx-auto my-auto">
                    <Navbar {...props} />
                </div>
            </div>
        </div>
    );
};

export const Layout: React.FC<{}> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="mx-auto container">
                <ScrollingNavbar />
            </div>
            <div>{children}</div>
            <div className="flex flex-col-reverse flex-grow">
                <Footnotes />
            </div>
        </div>
    );
};

export default Layout;
