import type { RequestHandler } from "express";

declare module "cookie-parser" {
  const cookieParser: () => RequestHandler;
  export default cookieParser;
}

declare global {
  namespace Express {
    interface Request {
      cookies?: Record<string, unknown>;
    }
  }
}

export {};
