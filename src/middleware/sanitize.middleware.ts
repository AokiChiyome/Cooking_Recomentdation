import { Request, Response, NextFunction } from "express";
import { sanitizeInput } from "../utils/sanitize";

export function sanitizeRequestBody(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInput(req.body);
  }
  next();
}
