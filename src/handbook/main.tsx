import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HandbookApp } from "./HandbookApp";
import "./handbook.css";

createRoot(document.getElementById("handbook-root")!).render(
  <StrictMode>
    <HandbookApp />
  </StrictMode>,
);
