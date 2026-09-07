import { INTEGRATED_EXPORT_BRAND } from "../content/group.js";

type IeCommodityMediaPlaceholderProps = {
  /** Accessible name when the placeholder is meaningful; omit for decorative. */
  label?: string;
  className?: string;
  decorative?: boolean;
};

/**
 * IE media placeholder - no stock photography.
 * Used when approved hero/gallery media is not yet available.
 */
export function IeCommodityMediaPlaceholder({
  label = "Approved imagery forthcoming",
  className = "",
  decorative = false,
}: IeCommodityMediaPlaceholderProps) {
  return (
    <div
      className={`hamd-aie-media-placeholder ${className}`.trim()}
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "img" as const, "aria-label": label })}
    >
      <span className="hamd-aie-media-placeholder__mark" aria-hidden="true">
        {INTEGRATED_EXPORT_BRAND.provisionalMark}
      </span>
      {!decorative ? (
        <span className="hamd-aie-media-placeholder__label">{label}</span>
      ) : null}
    </div>
  );
}
