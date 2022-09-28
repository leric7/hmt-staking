import { Request, Response, NextFunction } from "express";
import config from "../config";

/**
 * middleware to check whether user is an operator
 */
export const authorizeOperator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let apiKey = req.headers["x-api-key"];

    if (apiKey !== config.api.operatorKey) {
      return res.status(401).json({ message: "Not an operator" });
    }

    next();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    res.status(500).json({ message: "Failed to authenticate user" });
  }
};
