import { useParams, useSearchParams } from "react-router-dom";
import { ResetPasswordScreen, PasswordChangedScreen } from "@hamd/ui/auth";
import { useState } from "react";
import { resetPasswordRequest } from "../api/auth-client.js";

export function ResetPasswordPage() {
  const { token: pathToken } = useParams();
  const [params] = useSearchParams();
  const token = pathToken || params.get("token") || "";
  const [done, setDone] = useState(false);

  if (done) {
    return <PasswordChangedScreen loginHref="/login" />;
  }

  return (
    <ResetPasswordScreen
      token={token}
      onSubmit={async (password) => {
        if (!token) {
          throw new Error("Reset link is missing or incomplete.");
        }
        await resetPasswordRequest({ token, password });
        setDone(true);
      }}
      loginHref="/login"
    />
  );
}
