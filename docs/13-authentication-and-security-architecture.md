# HAMD Genesis - Authentication and Security Architecture

**Purpose:** Secure identity, session, authorization, and account-protection
architecture for an international procurement platform.  
**Scope:** Public Website, Client Workspace, Operations Console, APIs,
integrations, and future enterprise SSO.

## 1. Security principles

HAMD handles procurement, supplier, financial, logistics, document, and
organization data. Identity is therefore a business-control boundary, not
merely a login screen.

1. **Phishing resistance where possible:** prefer authenticator-app TOTP and
future WebAuthn/passkeys for high-risk accounts; email OTP is a fallback, not
the strongest factor.
2. **Least privilege and tenant isolation:** every request resolves trusted
organization/membership/permission context server-side.
3. **Short-lived credentials, revocable sessions:** access is brief; refresh
tokens rotate and are stored as hashes; sessions/devices can be revoked.
4. **Defense in depth:** validation, authorization, rate limits, CSRF/CORS,
security headers, logging, encryption, anomaly detection, and incident
response work together.
5. **Usable security:** clear messages, safe recovery, visible device history,
and step-up verification reduce risky support workarounds.
6. **No security claims without evidence:** payment, data, supplier, and
enterprise security messaging must reflect actual controls and certifications.

## 2. Identity and authentication methods

### Email and password

Email/password is available for organizations that do not use SSO.

- Email is normalized for comparison and stored/displayed safely without
  changing the user’s intended visible address.
- Passwords use Argon2id with a reviewed memory/time/parallelism profile and a
  unique salt; bcrypt is acceptable only as legacy compatibility during
  migration.
- Enforce a minimum length of 12 characters, allow long passphrases and
  password managers, reject known-compromised passwords through a
  privacy-preserving breach check, and avoid arbitrary composition rules.
- Do not log passwords, reset codes, raw tokens, or credential-bearing request
  bodies.

### Google and Microsoft

Use OpenID Connect authorization code flow with PKCE and verified redirect URI
allowlists. Do not rely on an email claim alone before validating issuer,
audience, signature, nonce, state, token expiry, and subject identifier.

Provider identities are linked to a HAMD user through a dedicated identity
record. Automatic account linking requires verified email and explicit secure
policy; otherwise require the existing user to authenticate before linking.

### Future SSO and enterprise login

Support OIDC first and SAML 2.0 where enterprise demand requires it. Each
organization owns verified identity-provider configuration, allowed domains,
attribute mapping, JIT provisioning policy, group-to-role mapping, and
enforcement mode.

Future enterprise controls:

- domain verification before discovery/login routing;
- SCIM provisioning/deprovisioning;
- mandatory SSO and MFA policy per organization;
- break-glass platform administrator process, separately audited;
- session/identity provider metadata rotation and certificate expiry alerts.

## 3. Account lifecycle

### Registration and verification

1. Create a pending user with verified ownership path, minimal data, and
   rate-limited verification challenge.
2. Send a single-use, hashed, short-lived email verification token.
3. Mark email verified only after atomic token redemption.
4. Invite flow verifies the invitation recipient and associates the user with a
   controlled organization membership; invitations never grant implied broader
   access.
5. Account status is distinct from membership status: a suspended account loses
   all access; a removed membership loses only one organization.

### Password reset

- Always return a generic response regardless of email existence.
- Rate limit per account, IP/network signal, and device.
- Store reset token hash with issued/expiry/used fields; one active reset token
  per account, invalidated on password change.
- Require step-up verification for high-risk reset circumstances.
- Revoke active sessions after reset by default, preserving only a verified
  recovery session if policy permits.

### Account recovery

Recovery uses verified email plus recovery codes or administrator-approved
enterprise recovery. It must not rely on support staff asking for informal
personal information. Sensitive recovery actions create high-severity audit
events and user notification.

## 4. Sessions, JWTs, refresh tokens, and devices

### Session model

HAMD uses a server-side session record as the revocation/control point.

- **Access token:** short-lived signed JWT, intended lifetime 5–15 minutes,
  includes opaque session ID, user ID, token version, issuer, audience, issued/
  expiry time, and minimal authorized organization context. It contains no
  sensitive PII, permissions list, supplier data, or mutable financial claims.
- **Refresh token:** opaque high-entropy random secret, not a JWT; stored only
  as a hash on the server, bound to a session/device, with 7–30 day policy
  lifetime depending on “remember device” policy.
- **Rotation:** every refresh atomically issues a new refresh token and
  invalidates the prior token. Reuse of an invalidated refresh token revokes
  the entire token family/session and triggers suspicious-session handling.
- **Transport:** browser refresh token uses Secure, HttpOnly, SameSite
  cookie with a narrow path/domain where architecture permits. Mobile/native
  future clients use platform secure storage and a refresh protocol appropriate
  to their security model.

### Session management

Users can view active sessions/devices with coarse location, first/last seen,
client type, authentication method, and risk state. They can revoke a single
session or all others. Security-sensitive actions require recent
reauthentication/MFA even if a session exists.

### Trusted/remembered devices

A “remember this device” choice means the refresh session may persist within
policy. It does not mean bypass MFA forever. Trust is revoked when password,
MFA, role, organization, provider identity, or device risk materially changes.
Device records use a privacy-minimized fingerprint/token; HAMD must not use
invasive browser fingerprinting.

### Location and login history

Store approximate IP-derived country/region, autonomous-system/risk metadata,
timestamp, and client family. Do not claim precise location. Users receive
security alerts for materially new device/location, recovery, MFA change, SSO
change, privileged-role assignment, and suspicious activity.

## 5. MFA and step-up authentication

### Factors

1. **Authenticator application (TOTP):** primary user-managed MFA method.
   Secrets are encrypted at rest; enrollment requires confirmation using a
   valid code.
2. **Email OTP:** lower-assurance fallback for bootstrap/recovery only;
   single-use, short expiry, rate limited, hashed server storage.
3. **Recovery codes:** single-use, high-entropy codes displayed once, stored as
   hashes, downloadable/printable with clear warning, regenerated on use
   policy.
4. **Future passkeys/WebAuthn:** recommended evolution for phishing-resistant
   MFA and passwordless sign-in.

MFA is mandatory for platform administrators, finance/payment/reconciliation
roles, supplier-bank change approvers, and organization administrators.
Organizations may require MFA for all members. Step-up is mandatory before
payment release/refund, bank-account changes, role/permission changes,
invitation/domain/SSO changes, API key creation, data export, and recovery.

## 6. Authorization architecture

### RBAC plus scoped permissions

Role-based access control supplies understandable role templates; fine-grained
permissions provide enforcement.

Each authorization decision checks:

1. authenticated user/session is active;
2. organization membership is active;
3. role permission grants the action;
4. record organization and relationship scope match;
5. record lifecycle allows the action;
6. separation-of-duties and approval policy permit it;
7. any step-up/MFA/security policy has been satisfied.

Permissions follow `resource:action` semantics, e.g. `request:read`,
`quote:issue`, `payment:confirm`, `supplier_bank:approve`, `audit:export`.
They are versioned reference data, not uncontrolled free-text strings.

### Role matrix

| Role | Primary capability | Explicit limits |
| --- | --- | --- |
| Client requester | Create/manage own organization requests and documents. | Cannot approve beyond delegated policy or see internal notes. |
| Client approver | Approve/reject scoped commercial decisions. | Cannot alter quote terms or release funds without finance authority. |
| Organization administrator | Manage members, teams, policies, organization settings. | Cannot grant platform roles or bypass organization security policy. |
| Procurement officer | Triage, source, build quotes, manage supplier work. | Cannot self-approve restricted/high-value decision. |
| Procurement lead | Review assignments, supplier/quote exceptions, controlled approvals. | Cannot release customer funds without finance permission. |
| Finance operator | Issue invoices, reconcile payment evidence, allocate payment. | Cannot approve their own controlled payment release. |
| Finance controller | Approve/release/reverse controlled finance actions. | Subject to value thresholds and step-up verification. |
| Logistics coordinator | Plan shipments, milestones, documents, exceptions. | Cannot change commercial/payment state. |
| Support specialist | Manage support cases and customer communication. | No broad financial/supplier confidential access. |
| Content/celebration author | Draft governed public/internal content. | Cannot self-publish broad campaigns. |
| Platform administrator | Operate platform configuration and incident controls. | Requires MFA, JIT/break-glass policy, full audit. |
| Auditor | Read permitted immutable audit/report records. | No business-data modification. |

### Custom and department roles

Organizations can compose custom roles from an allowlisted permission catalog,
bounded by platform policy. Department/cost-center/team scope attaches to
membership role assignments. A custom role cannot grant platform-sensitive
permissions, weaken separation-of-duties, or cross organization boundaries.

Permission change, role assignment, and delegated approval actions are audited,
notify affected users where appropriate, and require approval for privileged
roles.

## 7. API security and browser protections

### API authentication and authorization

- Authenticate every non-public route; verify JWT signature, issuer, audience,
  expiry, token version, session status, and refresh-family risk state.
- Authorize every resource action in the service layer from trusted IDs, never
  route parameters alone.
- Use request IDs/correlation IDs, schema validation, safe structured errors,
  idempotency keys for money/webhook/import/export operations, and pagination/
  filtering/search/sort controls.
- Service-to-service access uses scoped machine identities/API keys or workload
  identity, never a human admin token.

### Rate limiting and bot defense

Use layered limits on IP/network, account/email, session, organization, device
risk, and endpoint class. Apply strict limits to login, registration,
verification, reset, OTP, invitation, token refresh, public tracking, and
uploads. Return generic safe responses that avoid user enumeration.

CAPTCHA is adaptive: challenge only after abuse/risk signals, not every normal
user. Use a privacy-reviewed provider and an accessible alternative/support
path. CAPTCHA is not a replacement for rate limits or fraud detection.

### CSRF

If browser session/refresh authentication uses cookies, require CSRF protection
for all state-changing browser requests: SameSite policy plus server-validated
anti-CSRF token/origin checks, and no state-changing GET routes. Do not rely on
SameSite alone.

### CORS

Use a strict environment-specific origin allowlist. Never use wildcard origins
with credentials. Allow only required methods/headers, validate `Origin`, set
appropriate `Vary: Origin`, and maintain separate public API rules. Local
development origins are explicit and never ship as production defaults.

### Security headers

Use Helmet or equivalent to enforce a reviewed Content Security Policy,
HSTS after HTTPS stability, frame ancestors/clickjacking protection,
`nosniff`, referrer policy, permissions policy, and a narrow cross-origin
resource policy. CSP permits only approved first-party assets and required
providers; it is not weakened to accommodate inline script or unvetted media.

## 8. Cryptography, data protection, and secrets

- TLS 1.2+ in transit; encryption at rest through managed storage/database
  controls and field-level envelope encryption for high-risk values such as
  TOTP secrets and supplier bank data.
- Passwords, session/refresh/reset/OTP/recovery/API secrets are stored as
  strong one-way hashes where retrieval is unnecessary.
- Encryption keys live in managed KMS/secrets infrastructure, are scoped,
  rotated, and never appear in source, logs, analytics, or client bundles.
- Tokens are generated from cryptographically secure randomness and compared
  in constant time where applicable.
- Uploaded files are virus-scanned, type/size checked, privately stored, and
  served through short-lived authorized URLs.
- Data classification, retention, legal hold, anonymization, and cross-border
  processing policy apply to PII, credentials, candidate/supplier, finance,
  device, and behavioral data.

## 9. Audit logging, activity, and detection

### Immutable audit events

Record actor, session/device context, organization, action, target, outcome,
reason, safe before/after metadata, IP/risk context, timestamp, and correlation
ID for authentication, access, privilege, policy, finance, supplier bank,
document, export, integration, and admin actions.

Audit logs are append-only, access controlled, retention-governed, and
exportable only to authorized auditor roles. They are not customer-facing
activity feed data.

### Suspicious login detection

Risk signals include failed-login velocity, IP/network reputation, impossible
or improbable travel, new device, new country/region, Tor/VPN/proxy policy
signal where lawful, credential-stuffing indicators, refresh-token reuse,
unusual session behavior, and privileged action anomalies.

Risk response is proportionate:

- low: log and observe;
- medium: notify user or require MFA;
- high: require step-up, revoke token family, temporarily lock sensitive
  actions, and create security-review event;
- confirmed compromise: suspend/revoke sessions, notify affected parties,
  preserve evidence, and follow incident process.

Do not automatically lock legitimate users indefinitely based only on location
or IP; provide a safe recovery path.

## 10. Enterprise membership, teams, invitations, and approvals

### Invitations

Invite records contain organization, intended email, role/team scope, inviter,
expiry, token hash, status, and acceptance audit. Invitations are single-use,
revocable, rate-limited, domain-policy checked, and cannot silently escalate
privilege. Existing users must authenticate before accepting.

### Organization and team management

Organization admins may manage members and delegated roles within organization
policy. Team membership provides operational grouping and optional access scope;
it is not a substitute for tenant authorization.

### Approval flow security

Approvals use immutable policy versions, assignment/decision records, deadlines,
delegation, threshold/category/corridor scope, and separation-of-duties checks.
The same person cannot create and approve a controlled finance or high-risk
commercial action unless an explicit emergency override policy records reason,
second review, and alert.

## 11. Security UX requirements

- Login, OTP, recovery, and invitation screens use calm, generic,
  enumeration-safe language and preserve legitimate user progress.
- Show password-manager/autofill compatibility, caps-lock warning, and
  accessible error summary; never reveal whether an account exists.
- Device/session history is understandable: device/browser, approximate
  location, time, and revoke action. Do not overstate location precision.
- Security alerts explain the event, impact, recommended action, and support
  path; they do not use panic-inducing language.
- Reauthentication explains why it is needed and returns the user to the
  intended action after success.
- All security flows meet WCAG 2.2 AA, keyboard operation, screen-reader
  semantics, reduced motion, mobile safe-area, slow-network, and offline
  recovery requirements.

## 12. Threat-model priorities

| Threat | Primary mitigations |
| --- | --- |
| Credential stuffing | Breached-password checks, rate limits, adaptive CAPTCHA, MFA, detection, generic errors. |
| Phishing/token theft | Short access tokens, rotating refresh families, HttpOnly cookies, PKCE, MFA/passkeys, session revoke. |
| CSRF/XSS | CSRF token/origin validation, strict CSP, output encoding/sanitization, no unsafe HTML. |
| Tenant data access | Server-side org scope, object authorization, permission checks, audit, optional RLS defense. |
| Privilege escalation | Permission catalog, scoped roles, approval for privileged changes, MFA/step-up, audit/alerts. |
| Payment/supplier fraud | Separation of duties, step-up, immutable approvals, verified bank changes, reconciliation. |
| Session fixation/replay | New session on login, token rotation, reuse detection, secure cookies, revocation. |
| API abuse | Rate limits, schema validation, quotas, logging, idempotency, WAF/bot controls where justified. |
| Insider misuse | Least privilege, audit review, JIT privileged access, export controls, dual control. |

## 13. Security operations and release criteria

- Conduct architecture/threat review before each identity, payment, supplier,
  SSO, AI, and public-tracking release.
- Run SAST, dependency/image/secret scanning, DAST/API testing, penetration
  testing before significant production milestones, and regular access reviews.
- Test account takeover, refresh replay, MFA recovery, tenant isolation,
  authorization bypass, CORS/CSRF, invitation abuse, webhook spoofing,
  privilege escalation, audit integrity, and rate-limit behavior.
- Maintain incident runbooks for credential compromise, provider outage, secret
  exposure, suspicious payment, data-access incident, and lost device.
- Define RTO/RPO, backups, restore drills, log retention, alert ownership, and
  responsible disclosure process.

## Final decision

HAMD must not treat JWT as a standalone security system or a UI role as
authorization. Secure enterprise procurement requires a revocable session
model, short-lived tokens, strong MFA/step-up, organization-scoped permission
enforcement, separation of duties, auditable decisions, and operational
security response.
