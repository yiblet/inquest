import React from "react";

export type OnPick = null | ((id: string) => any);
export const OnPickContext = React.createContext<OnPick>(null);
