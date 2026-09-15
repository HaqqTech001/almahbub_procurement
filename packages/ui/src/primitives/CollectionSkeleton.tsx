import { LoadingSkeleton } from "./LoadingSkeleton.js";

/** Host grid/card classes preserve the final collection's responsive geometry. */
export function CollectionSkeleton({ label, gridClassName, cardClassName, bodyClassName, count = 6, aspectRatio = "3 / 2", variant = "cards" }: {
  label: string; gridClassName: string; cardClassName?: string; bodyClassName?: string;
  count?: number; aspectRatio?: string; variant?: "cards" | "metrics";
}) {
  return <ul className={gridClassName} aria-label={label} aria-busy="true" style={{ listStyle: "none" }}>
    {Array.from({length: count}, (_, index) => <li key={index} aria-hidden="true">
      <div className={cardClassName}>
        {variant === "cards" ? <div className="hamd-skeleton hamd-skeleton--lg" style={{aspectRatio, width: "100%"}} /> : null}
        <div className={bodyClassName} style={bodyClassName ? undefined : {paddingBlock: "0.65rem"}}>
          <LoadingSkeleton height={variant === "metrics" ? "2rem" : "1.4rem"} width="72%" />
          <div style={{marginTop: "0.65rem"}}><LoadingSkeleton width="48%" height="0.9rem" /></div>
        </div>
      </div>
    </li>)}
  </ul>;
}
