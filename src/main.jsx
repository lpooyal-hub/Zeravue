import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.querySelector("#app")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
