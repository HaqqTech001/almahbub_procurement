import { Navigate } from "react-router-dom";
/** Compatibility entry for saved public links. The homepage is the business gateway. */
export function GroupPage() {
  return <Navigate to="/" replace />;
}
