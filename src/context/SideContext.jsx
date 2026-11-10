import { createContext, useContext } from "react";

// "bride" | "groom" | null — set by the /bride and /groom pages, null on the main page.
const SideContext = createContext(null);
export const SideProvider = SideContext.Provider;
export const useSide = () => useContext(SideContext);
