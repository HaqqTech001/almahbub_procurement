import { ForgotPasswordScreen } from "@hamd/ui/auth";
import { forgotPasswordRequest } from "../api/auth-client.js";

export function ForgotPasswordPage() {
  return (
    <ForgotPasswordScreen
      onSubmit={async (email) => {
        await forgotPasswordRequest(email);
      }}
    />
  );
}
