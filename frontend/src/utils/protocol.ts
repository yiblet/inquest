export const isSecure = () => {
    return (
        (process.browser &&
            window &&
            window.location.toString().startsWith("https")) ||
        false
    );
};
