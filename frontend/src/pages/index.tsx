import React, { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import Head from "next/head";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
    faMousePointer,
    faPowerOff,
    faExpandArrowsAlt,
    faWaveSquare,
    faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { gaService } from "../services/ga_service";

const CODE_STRING = `import inquest

def main():
    inquest.enable()
    ...


`;

declare global {
    const Calendly: {
        initPopupWidget: (data: Record<string, string>) => void;
    };
}

const openCalendly = gaService.wrapWithGa(
    () => {
        Calendly.initPopupWidget({
            url: "https://calendly.com/yiblet/30min",
        });
    },
    () => "User Clicked Calendly"
);

const Login: React.FC = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    useEffect(() => {
        setLoggedIn(getToken() != undefined);
    });

    return loggedIn ? (
        <Link href="/dashboard">
            <button className="mr-4 text-white px-4 rounded border">
                Dashboard
            </button>
        </Link>
    ) : (
        <Link href="/login">
            <button className="mr-4 text-white px-4 rounded border">
                Login
            </button>
        </Link>
    );
};

const Hero: React.FC = () => {
    return (
        <section className="hero bg-blue-600 w-full px-4">
            <div className="container mx-auto" style={{ minHeight: "60vh" }}>
                <div className="pt-5 flex justify-center md:justify-between mb-32 text-left items-baseline text-lg tracking-wider text-white">
                    <div className="hidden md:block logo uppercase text-2xl">
                        <Link href="/">
                            <a href="/">Inquest</a>
                        </Link>
                    </div>
                    <div>
                        <a className="mr-6" href="#features">
                            Features
                        </a>
                        {/* <a className="mr-6" href="#pricing"> */}
                        {/*     Pricing */}
                        {/* </a> */}
                        <Login />
                    </div>
                </div>
                <div className="flex flex-wrap justify-center">
                    <div className="max-w-lg my-5">
                        <div className="">
                            <div className="mb-3 text-5xl font-bold text-white">
                                Point, Click, And See.
                            </div>
                            <div className="mb-8 text-xl text-white">
                                Inquest is the fastest way to monitor your
                                running code. Instantly peer into what's
                                happening on any line of running code.
                            </div>
                            <button
                                className="font-bold bg-blue-200 px-12 py-4 text-blue-900 uppercase text-center text-2xl rounded-md shadow-md transition duration-500 ease-in-out hover:shadow-2xl transform hover:-translate-y-1"
                                onClick={openCalendly}
                            >
                                Sign Up For A Demo
                            </button>
                        </div>
                    </div>
                    <div className="mb-12 py-10 md:px-10">
                        <div className="mb-3 text-2xl font-medium text-white">
                            Set It Up In Seconds
                        </div>
                        <div
                            className="bg-black rounded-lg overflow-hidden shadow-2xl w-full text-white p-2"
                            style={{
                                backgroundColor: "rgb(40, 44, 52)",
                            }}
                        >
                            <div className="mr-16 sm:mr-20 md:mr-32">
                                <SyntaxHighlighter
                                    language="python"
                                    style={atomOneDark}
                                >
                                    {CODE_STRING}
                                </SyntaxHighlighter>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Feature: React.FC<{ title: string; icon: IconProp }> = ({
    children,
    title,
    icon,
}) => {
    return (
        <div className="max-w-md p-10 text-blue-900">
            <span className="flex items-center mb-4">
                <span
                    className="mr-4 inline-block flex justify-center items-center text-blue-800 bg-blue-200 rounded-full text-blue-900"
                    style={{
                        width: "3rem",
                        height: "3rem",
                        fontSize: "1.5rem",
                    }}
                >
                    <FontAwesomeIcon icon={icon} />
                </span>
                <h3 className="text-xl font-bold">{title}</h3>
            </span>
            <p className="ml-2">{children}</p>
        </div>
    );
};

const Features: React.FC = () => {
    return (
        <section id="features" className="container mx-auto">
            <div className="py-10 flex flex-wrap justify-center">
                <Feature title="Just Point And Click" icon={faMousePointer}>
                    Inquest let's you log extremely simply. Use our dashboard to
                    add new log statements and extract out metrics in the same
                    way you would add break statements in debugging.
                </Feature>
                <Feature title="No Redeployments" icon={faPowerOff}>
                    Inquest is able to add new log statements into the code
                    without having to restart the original code. This lets you
                    quickly move about your code adding and removing logs and
                    getting the results in an instant.
                </Feature>
                <Feature title="Scales Effortlessly" icon={faExpandArrowsAlt}>
                    Inquest communicates with all your connected instances at
                    the same time. In secounds you can push new log statements
                    into all your running code and see the results.
                </Feature>
                <Feature title="No Overhead" icon={faWaveSquare}>
                    Inquest is idle unless there is something to log. You can
                    run this freely across your stack with no noticeable
                    performance costs.
                </Feature>
            </div>
        </section>
    );
};

const Pricing: React.FC = () => {
    const Utility: React.FC = ({ children }) => (
        <li className="flex items-center justify-between mb-4">
            <div
                className="checkbox mr-4 w-6 h-6 rounded-full bg-blue-200 flex justify-center items-center"
                style={{ fontSize: "0.5rem" }}
            >
                <FontAwesomeIcon icon={faCheck} />
            </div>
            <p className="flex-1">{children}</p>
        </li>
    );
    return (
        <section id="pricing" className="bg-gray-200">
            <div className="container mx-auto py-16">
                <div className="flex flex-wrap justify-center items-center">
                    <div className="p-10 mr-2 max-w-lg text-blue-900">
                        <h2 className="py-2 text-3xl font-bold">
                            Interested In Learning More?
                        </h2>
                        <p className="text-lg">
                            Setup a meeting with us. We'll answer your questions
                            and walk you through a demo.
                        </p>
                    </div>

                    <div className="text-blue-600 bg-white rounded-md shadow-2xl flex-col justify-around items-center p-10 flex">
                        <h1 className="text-5xl font-bold">
                            <span className="text-xl align-text-top">$</span>0
                        </h1>
                        <h2 className="ml-2 text-xl -mt-4 mb-12">
                            Forever For Beta Users
                        </h2>
                        <ul className="flex flex-col">
                            <Utility>Unlimited Logs</Utility>
                            <Utility>Unlimited Instances</Utility>
                            <Utility>1-on-1 Setup Tutorial</Utility>
                            <Utility>Slack Channel For Support</Utility>
                        </ul>

                        <button
                            className="mt-12 font-bold bg-blue-600 px-12 py-4 text-blue-100 uppercase text-center text-2xl rounded-md shadow-md transition duration-500 ease-in-out hover:shadow-2xl transform hover:-translate-y-1"
                            onClick={openCalendly}
                        >
                            Setup A Meeting
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Footnotes: React.FC = () => {
    return (
        <section id="footnotes" className="">
            <div className="container mx-auto py-4">
                <div className="flex flex-wrap justify-center items-center">
                    <div className="mr-2 text-blue-900">
                        <p className="text-lg">
                            Made With Love In San Francisco
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

function Index() {
    return (
        <div>
            <Head>
                <link
                    href="https://assets.calendly.com/assets/external/widget.css"
                    rel="stylesheet"
                />
                <script
                    src="https://assets.calendly.com/assets/external/widget.js"
                    type="text/javascript"
                ></script>
            </Head>
            <Hero />
            <Features />
            {/* <Pricing /> */}
            <Footnotes />
        </div>
    );
}

export default Index;
