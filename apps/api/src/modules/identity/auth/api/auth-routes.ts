import { Router } from "express";

import type { RequestHandler } from "express";

import type { Environment } from "../../../../config/env.js";
import { authAbuseLimiter } from "../../../../middleware/rate-limit.js";
import type { AuthService } from "../application/auth-service.js";
import { AuthController } from "./auth-controller.js";

export function createAuthRouter(
  authenticate: RequestHandler,
  service: AuthService,
  environment: Environment,
  abuseLimiter: RequestHandler = authAbuseLimiter,
): Router {
  const router = Router();
  const controller = new AuthController(service, environment);

  router.post("/register", abuseLimiter, controller.register);
  router.post("/login", abuseLimiter, controller.login);
  router.post("/refresh", abuseLimiter, controller.refresh);
  router.post("/forgot-password", abuseLimiter, controller.forgotPassword);
  router.post("/reset-password", abuseLimiter, controller.resetPassword);
  router.post(
    "/verify-email/:token",
    abuseLimiter,
    controller.verifyEmail,
  );
  router.post("/verify-email", abuseLimiter, controller.verifyEmail);
  router.post(
    "/resend-verification",
    abuseLimiter,
    controller.resendVerification,
  );
  router.post("/otp/resend", abuseLimiter, controller.resendVerification);
  router.post("/otp/verify", abuseLimiter, controller.verifyOtp);
  router.get("/google/status", controller.googleStatus);
  router.post("/google", abuseLimiter, controller.googleSignIn);
  router.get("/google", abuseLimiter, controller.googleStart);
  router.get("/google/callback", abuseLimiter, controller.googleCallback);
  router.get("/invitations/:token", abuseLimiter, controller.getInvitation);
  router.post(
    "/invitations/:token/accept",
    abuseLimiter,
    controller.acceptInvitation,
  );

  router.use(authenticate);
  router.post("/invitations", controller.createInvitation);
  router.post("/logout", controller.logout);
  router.post("/logout-everywhere", controller.logoutEverywhere);
  router.get("/sessions", controller.listSessions);
  router.delete("/sessions/:sessionId", controller.revokeSession);
  router.get("/devices", controller.listDevices);
  router.delete("/devices/:deviceId", controller.revokeDevice);
  router.get("/login-history", controller.loginHistory);
  router.get("/me", controller.me);
  router.patch("/profile", controller.updateProfile);
  router.patch("/password", controller.changePassword);
  router.get("/validate", controller.validate);

  return router;
}
