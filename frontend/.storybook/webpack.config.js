const path = require("path");

module.exports = ({ config }) => {
    config.module.rules.push({
        test: /\.(ts|tsx)$/,
        loader: require.resolve("babel-loader"),
        options: {
            presets: [require.resolve("babel-preset-react-app")],
        },
    });

    config.module.rules.push({
        test: /\.css$/,
        use: [
            {
                loader: "postcss-loader",
                options: {
                    ident: "postcss",
                    config: {
                        path: "./.storybook",
                    },
                    plugins: [
                        require("postcss-import"),
                        require("tailwindcss"),
                        require("autoprefixer"),
                    ],
                },
            },
        ],
        include: path.resolve(__dirname, "../"),
    });

    config.resolve.extensions.push(".ts", ".tsx");
    return config;
};
