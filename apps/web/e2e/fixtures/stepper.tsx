// Browser-only test fixture: real shared components, never a production route.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { HorizontalStepper } from "@hamd/ui";
import { RequestCreateWizard } from "@hamd/ui/procurement";
import { RegisterScreen } from "@hamd/ui/auth";
import "@hamd/ui/foundation.css";
import "@hamd/ui/auth.css";
import "@hamd/ui/procurement.css";

function Fixture() {
  const [current, setCurrent] = useState(0);
  const mode = new URLSearchParams(location.search).get("mode");
  if (mode === "register") return <RegisterScreen onSubmit={async () => {}} />;
  if (mode === "many")
    return (
      <main style={{ padding: 8 }}>
        <HorizontalStepper
          steps={Array.from({ length: 9 }, (_, i) => ({
            id: `${i}`,
            label: `Stage ${i + 1}`,
          }))}
          currentStep={current}
        />
        <button onClick={() => setCurrent(8)}>Last stage</button>
      </main>
    );
  return (
    <main style={{ padding: 8, maxWidth: 1100, margin: "auto" }}>
      <RequestCreateWizard
        onSubmit={async () => {
          throw Object.assign(new Error("Check request"), {
            details: [
              { field: "title", message: "Use a more specific title." },
            ],
          });
        }}
        initial={{
          title: "Valves for Lagos",
          destinationCountryCode: "NG",
          destinationAddress: "Lagos warehouse",
          items: [
            {
              id: "row",
              description: "Valves",
              quantity: 2,
              unit: "pcs",
              category: "",
              specifications: "",
            },
          ],
        }}
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Fixture />
  </React.StrictMode>,
);
