import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import "@/i18n";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast: "!font-sans",
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
