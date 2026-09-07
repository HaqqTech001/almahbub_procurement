import { useParams } from "react-router-dom";

import { QuotationsPage } from "./QuotationsPage.js";

/** Deep-linked quotation detail hosted inside the workspace. */
export function QuotationDetailPage() {
  const { id } = useParams();
  return <QuotationsPage {...(id ? { initialSelectedId: id } : {})} />;
}
