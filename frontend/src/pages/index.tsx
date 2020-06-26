import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
    faMousePointer,
    faPowerOff,
    faExpandArrowsAlt,
    faWaveSquare,
} from "@fortawesome/free-solid-svg-icons";
import { Navbar, Footnotes } from "../components/utils/layout";
import { useLoggedInState } from "../utils/auth";

const CODE_STRING = `import inquest

def main():
    inquest.enable()
    ...


`;

/**
 * The Hero section
 */
const Hero: React.FC = () => {
    const loggedIn = useLoggedInState();

    return (
        <section className="hero bg-blue-600 w-full">
            <div className="container mx-auto" style={{ minHeight: "60vh" }}>
                <div className={"sm:h-16 flex items-center"}>
                    <div className="w-full">
                        <Navbar light />
                    </div>
                </div>
                <div className="px-4 py-10 sm:py-20 flex flex-wrap justify-center">
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
                            {!loggedIn ? (
                                <Link href="/signup">
                                    <button className="font-bold bg-blue-200 px-12 py-4 text-blue-900 uppercase text-center text-2xl rounded-md shadow-md transition duration-500 ease-in-out hover:shadow-2xl transform hover:-translate-y-1">
                                        Get Started
                                    </button>
                                </Link>
                            ) : (
                                <Link href="/dashboard">
                                    <button className="font-bold bg-blue-200 px-12 py-4 text-blue-900 uppercase text-center text-2xl rounded-md shadow-md transition duration-500 ease-in-out hover:shadow-2xl transform hover:-translate-y-1">
                                        Go To Dashboard
                                    </button>
                                </Link>
                            )}
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
function Index() {
    return (
        <>
            <Hero />
            <Features />
            <Footnotes />
        </>
    );
}

export default Index;
