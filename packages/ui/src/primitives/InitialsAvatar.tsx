import { cx } from "../utils/cx.js";
import { makeInitials } from "./makeInitials.js";

export type InitialsAvatarSize = "sm" | "md" | "lg";

export type InitialsAvatarProps = {
  name: string;
  label?: string | undefined;
  size?: InitialsAvatarSize | undefined;
  src?: string | null | undefined;
  className?: string | undefined;
};

export function InitialsAvatar({
  name,
  label,
  size = "md",
  src,
  className,
}: InitialsAvatarProps) {
  const initials = makeInitials(name);
  const accessible = label ?? name;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cx("hamd-avatar", `hamd-avatar--${size}`, className)}
      />
    );
  }
  return (
    <span
      className={cx("hamd-avatar", `hamd-avatar--${size}`, className)}
      aria-label={accessible}
      role="img"
    >
      <span aria-hidden="true">{initials}</span>
    </span>
  );
}
