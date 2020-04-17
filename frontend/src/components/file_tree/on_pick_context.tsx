import React from "react";

export type OnPick = (id: string) => any;
export const OnPickContext = React.createContext<OnPick>(null);
