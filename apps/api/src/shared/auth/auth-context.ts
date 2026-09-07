export interface AuthContext {
  readonly userId: string;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly sessionId: string;
  readonly permissionKeys: ReadonlySet<string>;
}
