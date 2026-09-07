import { cx } from "../utils/cx.js";

export type SpinnerProps = {
  label?: string;
  className?: string;
};

export function Spinner({ label = "Loading", className }: SpinnerProps) {
  return (
    <span className={cx("hamd-spinner", className)} role="status" aria-label={label}>
      <span className="hamd-spinner__mark" aria-hidden="true" />
    </span>
  );
}
