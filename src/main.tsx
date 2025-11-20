import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/components/ThemeProvider.tsx"; 

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <HelmetProvider>
            <ThemeProvider defaultTheme="system" storageKey="bv-celular-theme">
                {" "}
                <App />
            </ThemeProvider>
        </HelmetProvider>
    </React.StrictMode>
);
