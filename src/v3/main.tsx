import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { V3App } from "./V3App";
import quicksandBoldUrl from "./fonts/Quicksand-Bold.ttf?url";
import quicksandMediumUrl from "./fonts/Quicksand-Medium.ttf?url";
import quicksandRegularUrl from "./fonts/Quicksand-Regular.ttf?url";
import "./v3.css";

const fontStyles = document.createElement("style");
fontStyles.textContent = `
  @font-face { font-family: "Quicksand"; src: url("${quicksandRegularUrl}") format("truetype"); font-style: normal; font-weight: 400; font-display: swap; }
  @font-face { font-family: "Quicksand"; src: url("${quicksandMediumUrl}") format("truetype"); font-style: normal; font-weight: 500; font-display: swap; }
  @font-face { font-family: "Quicksand"; src: url("${quicksandBoldUrl}") format("truetype"); font-style: normal; font-weight: 700; font-display: swap; }
`;
document.head.append(fontStyles);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <V3App />
  </StrictMode>,
);
