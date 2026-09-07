import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InvitationAcceptanceScreen } from "@hamd/ui/auth";
import {
  acceptInvitationRequest,
  getInvitationRequest,
  type InvitationPreview,
} from "../api/auth-client.js";
import { AuthApiError } from "../api/auth-errors.js";
import { useAuth } from "../session/AuthProvider.js";
import { setAccessToken } from "../session/token-store.js";

export function InvitationPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!token) {
        setError("Invitation link is missing or incomplete.");
        setLoading(false);
        return;
      }
      try {
        const data = await getInvitationRequest(token);
        if (!cancelled) setPreview(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof AuthApiError
              ? err.message
              : "Unable to load this invitation.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error && !preview) {
    return (
      <InvitationAcceptanceScreen
        organizationName="your organization"
        onAccept={async () => {
          throw new Error(error);
        }}
        requirePassword={false}
      />
    );
  }

  return (
    <InvitationAcceptanceScreen
      {...(preview?.organizationName
        ? { organizationName: preview.organizationName }
        : {})}
      {...(preview?.inviterName ? { inviterName: preview.inviterName } : {})}
      {...(preview?.email ? { email: preview.email } : {})}
      loading={loading}
      onAccept={async (values) => {
        if (!token) throw new Error("Invitation token is missing.");
        if (!values.firstName || !values.lastName) {
          throw new Error("First and last name are required.");
        }
        const session = await acceptInvitationRequest({
          token,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
        });
        setAccessToken(session.accessToken, session.expiresIn);
        await auth.refreshSession();
        navigate("/app", { replace: true });
      }}
    />
  );
}
