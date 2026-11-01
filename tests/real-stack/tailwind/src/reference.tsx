import "./reference.css";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Utilities } from "./App";

function Reference() {
  useEffect(() => document.documentElement.setAttribute("data-mounted", ""), []);
  return <Utilities />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Reference /></StrictMode>);
