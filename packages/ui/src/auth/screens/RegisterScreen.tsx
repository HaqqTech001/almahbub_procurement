import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AuthShell } from "../AuthShell.js";
import {
  AuthAlert,
  AuthCheckbox,
  AuthFloatingField,
  AuthPasswordField,
  AuthSubmitButton,
} from "../AuthFields.js";
import { isStrongEnough, isValidEmail, PASSWORD_POLICY_HINT } from "../validation.js";

export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  companyType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  password: string;
  agreeToTerms: boolean;
};

export type RegisterScreenProps = {
  onSubmit: (values: RegisterFormValues) => void | Promise<void>;
  loginHref?: string;
  termsHref?: string;
  loading?: boolean | undefined;
  googleSlot?: ReactNode;
  googleSignInHref?: string | null;
  errorMessage?: string | null;
};

const COMPANY_TYPES = [
  "Importer",
  "Distributor",
  "Manufacturer",
  "Retailer",
  "Other",
];

export function RegisterScreen({
  onSubmit,
  loginHref = "/login",
  termsHref = "/terms",
  loading,
  googleSlot = null,
  googleSignInHref = null,
  errorMessage = null,
}: RegisterScreenProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(errorMessage);

  useEffect(() => {
    setFormError(errorMessage);
  }, [errorMessage]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    companyType: "",
    address: "",
    city: "",
    state: "",
    country: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const set =
    (key: keyof typeof form) =>
    (value: string | boolean) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep = (s: number) => {
    const next: Record<string, string> = {};
    if (s === 1) {
      if (!form.firstName.trim()) next.firstName = "First name is required.";
      if (!form.lastName.trim()) next.lastName = "Last name is required.";
      if (!isValidEmail(form.email)) next.email = "Enter a valid email.";
    }
    if (s === 2) {
      if (!form.companyName.trim()) next.companyName = "Company name is required.";
    }
    if (s === 3) {
      if (!isStrongEnough(form.password)) {
        next.password = PASSWORD_POLICY_HINT;
      }
      if (form.password !== form.confirmPassword) {
        next.confirmPassword = "Passwords do not match.";
      }
      if (!form.agreeToTerms) next.agreeToTerms = "Accept the terms to continue.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      if (validateStep(step)) setStep(step + 1);
      return;
    }
    if (!validateStep(3)) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyName: form.companyName.trim(),
        companyType: form.companyType,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        password: form.password,
        agreeToTerms: form.agreeToTerms,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      variant="register"
      title="Create account"
      description="Three short steps: your details, company, then credentials."
      documentTitle="Register · Almahbub International"
      loading={loading}
      footer={
        <p>
          Already registered?{" "}
          <a href={loginHref} className="hamd-auth-link">
            Sign in
          </a>
        </p>
      }
    >
      <ol className="hamd-auth-steps" aria-label="Registration progress">
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            className={
              n === step ? "is-current" : n < step ? "is-done" : undefined
            }
            aria-current={n === step ? "step" : undefined}
          >
            Step {n}
          </li>
        ))}
      </ol>
      <form className="hamd-auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <AuthAlert tone="error" title="Could not register">
            {formError}
          </AuthAlert>
        ) : null}

        {step === 1 ? (
          <>
            <AuthFloatingField
              label="First name"
              name="firstName"
              autoComplete="given-name"
              value={form.firstName}
              error={fieldErrors.firstName}
              autoFocus
              onChange={(e) => set("firstName")(e.target.value)}
            />
            <AuthFloatingField
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              value={form.lastName}
              error={fieldErrors.lastName}
              onChange={(e) => set("lastName")(e.target.value)}
            />
            <AuthFloatingField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              error={fieldErrors.email}
              onChange={(e) => set("email")(e.target.value)}
            />
            <AuthFloatingField
              label="Phone (optional)"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              error={fieldErrors.phone}
              onChange={(e) => set("phone")(e.target.value)}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <AuthFloatingField
              label="Company name"
              name="companyName"
              autoComplete="organization"
              value={form.companyName}
              error={fieldErrors.companyName}
              autoFocus
              onChange={(e) => set("companyName")(e.target.value)}
            />
            <div className="hamd-auth-field">
              <label className="hamd-auth-select__label" htmlFor="companyType">
                Company type (optional)
              </label>
              <select
                id="companyType"
                className="hamd-auth-select"
                value={form.companyType}
                aria-invalid={Boolean(fieldErrors.companyType)}
                onChange={(e) => set("companyType")(e.target.value)}
              >
                <option value="">Select type</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {fieldErrors.companyType ? (
                <p className="hamd-auth-field__error" role="alert">
                  {fieldErrors.companyType}
                </p>
              ) : null}
            </div>
            <AuthFloatingField
              label="Address (optional)"
              name="address"
              autoComplete="street-address"
              value={form.address}
              error={fieldErrors.address}
              onChange={(e) => set("address")(e.target.value)}
            />
            <AuthFloatingField
              label="City (optional)"
              name="city"
              autoComplete="address-level2"
              value={form.city}
              error={fieldErrors.city}
              onChange={(e) => set("city")(e.target.value)}
            />
            <AuthFloatingField
              label="State / region (optional)"
              name="state"
              autoComplete="address-level1"
              value={form.state}
              error={fieldErrors.state}
              onChange={(e) => set("state")(e.target.value)}
            />
            <AuthFloatingField
              label="Country (optional)"
              name="country"
              autoComplete="country-name"
              value={form.country}
              error={fieldErrors.country}
              onChange={(e) => set("country")(e.target.value)}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <AuthPasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              showStrength
              value={form.password}
              error={fieldErrors.password}
              autoFocus
              onChange={(e) => set("password")(e.target.value)}
            />
            <p className="hamd-auth-fineprint">{PASSWORD_POLICY_HINT}</p>
            <AuthPasswordField
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={(e) => set("confirmPassword")(e.target.value)}
            />
            <AuthCheckbox
              label={`I agree to the terms`}
              checked={form.agreeToTerms}
              onChange={(v) => set("agreeToTerms")(v)}
            />
            <p className="hamd-auth-fineprint">
              Read the{" "}
              <a href={termsHref} className="hamd-auth-link">
                terms of use
              </a>
              .
            </p>
            {fieldErrors.agreeToTerms ? (
              <p className="hamd-auth-field__error" role="alert">
                {fieldErrors.agreeToTerms}
              </p>
            ) : null}
          </>
        ) : null}

        <div className="hamd-auth-form__actions">
          {step > 1 ? (
            <button
              type="button"
              className="hamd-auth-secondary"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          ) : null}
          <AuthSubmitButton loading={submitting}>
            {step < 3 ? "Continue" : "Create account"}
          </AuthSubmitButton>
        </div>
        {step === 1 && (googleSlot || googleSignInHref) ? (
          <>
            <div className="hamd-auth-divider" role="separator" aria-label="Or">
              <span>or</span>
            </div>
            {googleSlot ? (
              <div className="hamd-auth-google-slot">{googleSlot}</div>
            ) : googleSignInHref ? (
              <a className="hamd-auth-google" href={googleSignInHref}>
                Continue with Google
              </a>
            ) : null}
          </>
        ) : null}
      </form>
    </AuthShell>
  );
}
