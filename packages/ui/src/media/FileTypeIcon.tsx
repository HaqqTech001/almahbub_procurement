export function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.trim().toUpperCase();
  const label = !ext || ext === name.toUpperCase() ? "FILE" : ext.slice(0, 5);
  return (
    <span className="hamd-file-type-icon" aria-hidden="true">
      {label}
    </span>
  );
}
