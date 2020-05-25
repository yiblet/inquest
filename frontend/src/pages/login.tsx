import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { login } from "../utils/auth";
import { getPublicRuntimeConfig } from "../config";
import { WithTitle } from "../components/utils/with_title";
import { LabelledField } from "../components/utils/labelled_field";
const INPUT_STYLE =
    "bg-gray-200 placeholder-gray-700 text-lg text-md my-2 p-2 w-full";

export default function Login() {
    const { handleSubmit, register, errors } = useForm();
    const [fetching, setFetching] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const onSubmit = async (values: { email: string; password: string }) => {
        setFetching(true);
        try {
            const resp = await fetch(
                `http://${getPublicRuntimeConfig().endpoint}/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams(values).toString(),
                }
            );
            console.log(resp);
            if (resp.status === 400)
                setMessage((await resp.json())?.message || "internal error");
            else {
                setMessage(null);
                // TODO check if the response contains a token
                const { token }: { token: string } = await resp.json();
                login(token);
            }
        } finally {
            setFetching(false);
        }
    };

    const errorMessages = [
        message,
        errors.email && errors.email.message,
        errors.password && errors.password.message,
    ]
        .filter((value) => !!value)
        .map((value) => <span key={value}>{value}</span>);

    return (
        <WithTitle title="login">
            <div className="bg-gray-300 w-full h-full py-10 min-h-screen">
                <div className="mx-auto container">
                    <div className="mx-auto w-5/6 md:w-6/12 lg:w-4/12 xl:w-3/8">
                        <div className="flex items-baseline px-4 mb-4">
                            <h1 className="text-3xl font-semibold text-gray-700">
                                Login
                            </h1>
                        </div>
                        <form
                            className="flex flex-col rounded-t-lg p-4 bg-white"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <LabelledField label="email*">
                                <input
                                    className={INPUT_STYLE}
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="your email"
                                    ref={register({
                                        required: true,
                                        pattern: {
                                            value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                            message: "must be a valid email",
                                        },
                                    })}
                                />
                            </LabelledField>
                            <LabelledField label="password*">
                                <input
                                    className={INPUT_STYLE}
                                    type="password"
                                    name="password"
                                    placeholder="******"
                                    required
                                    ref={register({
                                        minLength: {
                                            value: 8,
                                            message:
                                                "password must be at least 8 characters",
                                        },
                                        maxLength: {
                                            value: 24,
                                            message:
                                                "password must be at most 8 characters",
                                        },
                                        required: true,
                                    })}
                                />
                            </LabelledField>
                            <div className="flex items-baseline pt-4">
                                {!fetching ? (
                                    <button className="rounded inline-block bg-blue-600 text-white text-lg text-md p-2 px-4 mr-4">
                                        Login
                                    </button>
                                ) : (
                                    <div className="rounded inline-block bg-gray-600 text-white text-lg text-md p-2 px-4 mr-4">
                                        Loading
                                    </div>
                                )}
                                <Link href="/signup">
                                    <a className="font-bold">
                                        Or Make A New Account
                                    </a>
                                </Link>
                            </div>
                        </form>
                        <div className="grid grid-cols-1 row-gaps-2 justify-between text-gray-700 rounded-b-lg p-4 bg-gray-200">
                            {/* <span>Forgot your email or password?</span> */}
                            {errorMessages}
                        </div>
                    </div>
                </div>
            </div>
        </WithTitle>
    );
}
