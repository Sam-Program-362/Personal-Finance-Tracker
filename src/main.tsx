import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ConvexClientProvider } from "./lib/ConvexClientProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexClientProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexClientProvider>
  </StrictMode>,
);
