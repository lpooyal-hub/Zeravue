import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { RootApp } from "./RootApp.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.querySelector("#app")).render(
  <React.StrictMode>
    <ThemeProvider>
      <RootApp />
    </ThemeProvider>
  </React.StrictMode>
);
