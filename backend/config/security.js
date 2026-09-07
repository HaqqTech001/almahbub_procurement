const DEFAULT_JWT_SECRETS = new Set([
  'fallback_secret_key',
  'change-me',
  'secret',
]);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length < 32 || DEFAULT_JWT_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET must be set to a unique value of at least 32 characters.'
    );
  }

  return secret;
}

function getAllowedOrigins() {
  const configuredOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL;
  const defaults = ['http://localhost:5173', 'http://localhost:5174'];
  const values = configuredOrigins
    ? configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
    : process.env.NODE_ENV === 'production'
      ? []
      : defaults;

  const origins = values.map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      throw new Error(`ALLOWED_ORIGINS contains an invalid URL: ${origin}`);
    }
  });

  if (origins.length === 0) {
    throw new Error(
      'ALLOWED_ORIGINS or CLIENT_URL must be configured in production.'
    );
  }

  return new Set(origins);
}

function assertLegacyRuntimeConfiguration() {
  getJwtSecret();
  return getAllowedOrigins();
}

module.exports = {
  assertLegacyRuntimeConfiguration,
  getJwtSecret,
};
