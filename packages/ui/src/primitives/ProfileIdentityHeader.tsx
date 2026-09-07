import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { InitialsAvatar } from "./InitialsAvatar.js";

export type ProfileIdentityHeaderProps = {
  name: string;
  email?: string | undefined;
  context?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string | undefined;
};

export function ProfileIdentityHeader({
  name,
  email,
  context,
  status,
  actions,
  className,
}: ProfileIdentityHeaderProps) {
  return (
    <header className={cx("hamd-profile-identity", className)}>
      <InitialsAvatar name={name} size="lg" />
      <h1 className="hamd-profile-identity__name">{name}</h1>
      {email ? (
        <a className="hamd-profile-identity__email" href={`mailto:${email}`}>
          {email}
        </a>
      ) : null}
      {status ? <div className="hamd-profile-identity__status">{status}</div> : null}
      {context ? <p className="hamd-profile-identity__context">{context}</p> : null}
      {actions ? (
        <div className="hamd-profile-identity__actions">{actions}</div>
      ) : null}
    </header>
  );
}
