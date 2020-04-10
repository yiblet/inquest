import "../styles/style.css";

import Link from "next/link";

const INPUT_STYLE = "bg-gray-200 placeholder-gray-700 text-lg text-md my-2 p-2";

export default () => {
    return (
        <div className="w-full h-full py-10 min-h-screen bg-gray-300">
            <div className="mx-auto container">
                <div className="mx-auto w-5/6 md:w-6/12 lg:w-4/12 xl:w-3/8">
                    <div className="flex items-baseline px-4 mb-4">
                        <h1 className="text-3xl font-semibold text-gray-700">
                            Login
                        </h1>
                    </div>
                    <form className="flex flex-col rounded-t-lg p-4 bg-white">
                        <input
                            className={INPUT_STYLE}
                            type="email"
                            placeholder="your email"
                            required
                        />
                        <input
                            className={INPUT_STYLE}
                            type="password"
                            placeholder="******"
                            required
                        />
                        <div className="flex items-baseline font-bold pt-4">
                            <button className="rounded inline-block bg-blue-600 text-white text-lg text-md p-2 px-4 mr-4">
                                Login
                            </button>
                            <Link href="/signup">Or Make A New Account</Link>
                        </div>
                    </form>
                    <div className="flex justify-between text-gray-700 rounded-b-lg p-4 bg-gray-200">
                        <span>Forgot your email or password?</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
