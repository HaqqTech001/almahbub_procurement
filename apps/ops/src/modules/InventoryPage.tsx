import { useState } from "react";

import { OpsAlert } from "../components/OpsChrome.js";
import { OpsModulePage } from "../components/OpsModulePage.js";
import { downloadCsv } from "../lib/export.js";

export function InventoryPage() {
  const [rows] = useState<Record<string, unknown>[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <>
      <OpsAlert tone="info">
        Inventory tracking is not live yet. Import and export stay available so
        operations can prepare files; no stock records are stored until the
        inventory API ships.
      </OpsAlert>
      <OpsModulePage
        title="Inventory"
        rows={rows}
        columns={[
          { key: "sku", label: "SKU" },
          { key: "location", label: "Location" },
          { key: "onHand", label: "On hand" },
          { key: "reserved", label: "Reserved" },
          { key: "status", label: "Status" },
        ]}
        loading={false}
        success={success}
        emptyMessage="No inventory records yet."
        searchKeys={["sku", "location", "status"]}
        onExport={(exportRows) => downloadCsv("inventory.csv", exportRows)}
        onImport={async (imported) => {
          setSuccess(
            `Parsed ${imported.length} inventory row(s). Persistence arrives with the inventory API.`,
          );
        }}
        bulkActions={[
          {
            id: "export-selected",
            label: "Export selected",
            onAction: (ids) => {
              downloadCsv(
                "inventory-selected.csv",
                rows.filter((row) => ids.includes(String(row.id))),
              );
            },
          },
        ]}
      />
    </>
  );
}
