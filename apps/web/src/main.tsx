import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App.js";
import { GlobalErrorBoundary } from "./app/GlobalErrorBoundary.js";
import { SpaLinkInterceptor } from "./app/SpaLinkInterceptor.js";
import { AppProviders } from "./app/providers/AppProviders.js";
import { AuthProvider } from "./auth/session/AuthProvider.js";

import "./styles/critical.js";

if (
  typeof window !== "undefined" &&
  (window.location.pathname === "/" || window.location.pathname === "")
) {
  void import("./pages/HomePage.js");
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root was not found.");
}

createRoot(root).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <SpaLinkInterceptor>
          <AppProviders>
            <AuthProvider>
              <App />
            </AuthProvider>
          </AppProviders>
        </SpaLinkInterceptor>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </StrictMode>,
);
