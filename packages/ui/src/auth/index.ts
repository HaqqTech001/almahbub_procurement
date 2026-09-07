export { AuthShell, AuthShellSkeleton } from "./AuthShell.js";
export type { AuthShellProps } from "./AuthShell.js";
export { AuthIllustration } from "./AuthIllustration.js";
export type { AuthIllustrationVariant } from "./AuthIllustration.js";
export { AuthMotion } from "./AuthMotion.js";
export { AuthOtpInput } from "./AuthOtpInput.js";
export type { AuthOtpInputProps } from "./AuthOtpInput.js";
export {
  AuthAlert,
  AuthCheckbox,
  AuthFloatingField,
  AuthPasswordField,
  AuthSubmitButton,
  scorePassword,
} from "./AuthFields.js";
export type {
  AuthAlertProps,
  AuthFloatingFieldProps,
  AuthPasswordFieldProps,
} from "./AuthFields.js";
export { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";
export {
  isStrongEnough,
  isValidEmail,
  passwordRules,
  PASSWORD_POLICY_HINT,
  safeInternalPath,
} from "./validation.js";

export { LoginScreen } from "./screens/LoginScreen.js";
export type { LoginFormValues, LoginScreenProps } from "./screens/LoginScreen.js";
export { RegisterScreen } from "./screens/RegisterScreen.js";
export type {
  RegisterFormValues,
  RegisterScreenProps,
} from "./screens/RegisterScreen.js";
export {
  EmailVerificationScreen,
  ForgotPasswordScreen,
  PasswordChangedScreen,
  ResetPasswordScreen,
} from "./screens/PasswordScreens.js";
export type {
  EmailVerificationScreenProps,
  ForgotPasswordScreenProps,
  ResetPasswordScreenProps,
} from "./screens/PasswordScreens.js";
export {
  OtpVerificationScreen,
  ResendVerificationScreen,
} from "./screens/OtpAndResendScreens.js";
export type {
  OtpVerificationScreenProps,
  ResendVerificationScreenProps,
} from "./screens/OtpAndResendScreens.js";
export {
  AccountLockedScreen,
  ForbiddenScreen,
  InvitationAcceptanceScreen,
  MfaPlaceholderScreen,
  SessionExpiredScreen,
  UnauthorizedScreen,
} from "./screens/StatusScreens.js";
export type {
  InvitationAcceptanceScreenProps,
  StatusScreenProps,
} from "./screens/StatusScreens.js";
export {
  isAuthExpiryResponse,
  peekErrorCode,
  runWithSessionRetry,
} from "./session-retry.js";
export type { SessionRetryHooks } from "./session-retry.js";
export {
  classifyRefreshFailure,
  isTerminalRefreshFailure,
  logSessionEvent,
  withRefreshLock,
} from "./refresh-outcome.js";
export type { RefreshOutcome } from "./refresh-outcome.js";
export {
  resolveBrowserApiBase,
  statusAfterFailedRefresh,
} from "./browser-api-base.js";
export {
  AUTH_BOOTSTRAP_TIMEOUT_MS,
  BROWSER_REQUEST_TIMEOUT_MS,
  CancelledRequestError,
  abortSignalAfter,
  createFetchGate,
  fetchWithTransientRetry,
  isAbortError,
  isCancelledRequest,
  isTransientHttpStatus,
  readResponseBody,
  runMutationThenRefresh,
  signalWithTimeout,
  timeoutMsForMethod,
  toCancelledRequestError,
  unwrapEnvelopeData,
  userFacingRequestError,
} from "./request-timeout.js";
export { sessionAwareFetch } from "./session-retry.js";

/** Lazy entry points for host apps (code splitting). */
export const authLazyScreens = {
  LoginScreen: () => import("./screens/LoginScreen.js"),
  RegisterScreen: () => import("./screens/RegisterScreen.js"),
  PasswordScreens: () => import("./screens/PasswordScreens.js"),
  OtpAndResendScreens: () => import("./screens/OtpAndResendScreens.js"),
  StatusScreens: () => import("./screens/StatusScreens.js"),
} as const;
