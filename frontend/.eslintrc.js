module.exports = {
    env: {
        commonjs: true,
        es6: true,
    },
    settings: {
        react: {
            version: "detect", // React version. "detect" automatically picks the version you have installed.
        },
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
            jsx: true,
        },
        sourceType: "module",
    },
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
    ],
    rules: {
        indent: [1, 4],
        "linebreak-style": [2, "unix"],
        quotes: [2, "double"],
        "@typescript-eslint/no-unused-vars": [1, { args: "none" }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "react/prop-types": "off",
    },
};
