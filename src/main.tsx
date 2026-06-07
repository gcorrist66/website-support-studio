import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { AppShell } from "./components/shell/AppShell";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>,
);
