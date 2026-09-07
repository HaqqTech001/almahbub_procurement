import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(1_024),
  organizationId: z.string().uuid().optional(),
  rememberMe: z.boolean().optional(),
  deviceFingerprint: z.string().trim().min(8).max(200).optional(),
  deviceName: z.string().trim().min(1).max(120).optional(),
  devicePlatform: z.string().trim().min(1).max(80).optional(),
});

export const refreshSchema = z.object({
  organizationId: z.string().uuid().optional(),
  csrfToken: z.string().trim().min(1).max(512).optional(),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    displayName: z.string().trim().min(1).max(200).nullable().optional(),
    locale: z.string().trim().min(2).max(35).optional(),
    timeZone: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .refine(
    (input) => Object.keys(input).length > 0,
    "Provide at least one profile field.",
  );

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128)
  .refine(
    (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value),
    "Password must include upper, lower, and a number.",
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(1_024),
  newPassword: strongPassword,
});

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: strongPassword,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(40).optional(),
  companyName: z.string().trim().min(1).max(200),
  companyType: z.string().trim().min(1).max(100).optional(),
  address: z.string().trim().min(1).max(300).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  state: z.string().trim().min(1).max(120).optional(),
  country: z.string().trim().min(2).max(80).optional(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue." }),
  }),
});

export const emailOnlySchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(6).max(200),
  password: strongPassword,
});

export const verifyEmailBodySchema = z.object({
  token: z.string().trim().min(4).max(200).optional(),
  code: z.string().trim().min(4).max(200).optional(),
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase())
    .optional(),
});

export const otpVerifySchema = z.object({
  code: z.string().trim().min(4).max(12),
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase())
    .optional(),
});

export const acceptInvitationSchema = z.object({
  password: strongPassword,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
});

/** GIS ID token only. Never accept client-sent profile or role objects. */
export const googleCredentialSchema = z
  .object({
    credential: z
      .string()
      .trim()
      .min(10)
      .max(8_192)
      .regex(
        /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
        "A signed Google ID token is required.",
      ),
    code: z.string().trim().min(4).max(12).optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .transform((value) => value.toLowerCase())
      .optional(),
  })
  .strict();
