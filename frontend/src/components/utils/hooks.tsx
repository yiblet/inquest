import { useState, useEffect } from "react";
import { getToken } from "../../utils/auth";

export const useLoggedInState = (): boolean => {
    const [loggedIn, setLoggedIn] = useState(false);
    useEffect(() => {
        setLoggedIn(getToken() != undefined);
    });
    return loggedIn;
};
