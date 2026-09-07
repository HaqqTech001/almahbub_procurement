import { Router } from "express";

export const API_ROOT_STATUS = {
  status: "ok",
  service: "Almahbub Procurement API",
  message: "API is running",
} as const;

export function createRootRouter(): Router {
  const router = Router();

  router.get("/", (_request, response) => {
    response.status(200).json(API_ROOT_STATUS);
  });

  router.head("/", (_request, response) => {
    response.status(200).end();
  });

  return router;
}
