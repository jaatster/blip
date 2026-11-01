import "./own.css";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Utilities } from "./App";

function Own() {
  useEffect(() => document.documentElement.setAttribute("data-mounted", ""), []);
  return <Utilities />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Own /></StrictMode>);
