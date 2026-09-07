import { useMemo, useState } from "react";
import {
  emptyEmailFilters,
  filterEmailTemplates,
  paginateEmailTemplates,
  type EmailDirectoryFilters,
  type EmailTemplateRecord,
} from "./types.js";

export function useEmailDirectory(templates: EmailTemplateRecord[]) {
  const [filters, setFilters] = useState<EmailDirectoryFilters>(
    emptyEmailFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    templates[0]?.id ?? null,
  );

  const filtered = useMemo(
    () => filterEmailTemplates(templates, filters),
    [templates, filters],
  );
  const page = useMemo(
    () => paginateEmailTemplates(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );
  const selected =
    filtered.find((row) => row.id === selectedId) ??
    page.items[0] ??
    filtered[0] ??
    null;

  return {
    filters,
    setFilters,
    filtered,
    page,
    selected,
    select: setSelectedId,
  };
}
