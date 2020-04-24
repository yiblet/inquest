import React from "react";
import { Stack } from "../../utils/collections";

export const ModalContext = React.createContext({
    modals: Stack<React.ReactChildren>(),
});
