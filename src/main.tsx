import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { AppRouter } from "./app/AppRouter";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
