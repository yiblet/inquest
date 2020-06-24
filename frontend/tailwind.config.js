const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
    purge: false,
    theme: {
        extend: {
            fontFamily: {
                sans: ["Roboto", ...defaultTheme.fontFamily.sans],
            },
        },
    },
    variants: {},
    plugins: [],
};
