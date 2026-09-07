import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App.js";
import { AuthProvider } from "./auth/session/AuthProvider.js";

import "@hamd/ui/foundation.css";
import "@hamd/ui/auth.css";
import "@hamd/ui/guidance.css";
import "@hamd/ui/dashboard.css";
import "@hamd/ui/catalog.css";
import "@hamd/ui/procurement.css";
import "@hamd/ui/quotations.css";
import "@hamd/ui/shipments.css";
import "@hamd/ui/notifications.css";
import "@hamd/ui/identity.css";
import "@hamd/ui/suppliers.css";
import "@hamd/ui/purchase-orders.css";
import "@hamd/ui/cms.css";
import "@hamd/ui/analytics.css";
import "@hamd/ui/audit.css";
import "@hamd/ui/platform-config.css";
import "@hamd/ui/chat.css";
import "@hamd/ui/styles.css";
import "@hamd/ui/module-layout.css";
import "@hamd/ui/wedding.css";
import "./styles/ops.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root was not found.");
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
