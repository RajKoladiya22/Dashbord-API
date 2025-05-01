import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthenticatedRequest } from "../../utils/interface";
import { sendErrorResponse } from "../../utils/httpResponse";
import { env } from "../../../config/database.config";

const _secret = env.JWT_SECRET as string;
const _expires = (env.JWT_EXPIRES_IN as string) || "30d";


// 🔒 Middleware: Authenticate JWT Token
export const authenticateUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.rJmkUxzNakU;
    // const token = req.cookies
  ;
    // console.log("token--->",token );

    if (!token) {
      // res.status(401).json({ message: "Authentication token missing" });
      sendErrorResponse(res, 401, "Authentication token missing");
      return;
    }

    const decoded = jwt.verify(token, _secret, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    // console.log("decoded--->", decoded);

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id ||
      !decoded.role
    ) {
      // res.status(401).json({ message: "Invalid token payload" });
      sendErrorResponse(res, 401, "Invalid token payload");
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      adminId: decoded.adminId,
    };

    next();
  } catch (err: any) {
    console.log("err.name---->", err.name);
    console.log("err---->", err);

    if (err.name === "TokenExpiredError") {
      res.clearCookie("rJmkUxzNakU", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      // res.status(401).json({ message: "Token expired" });
      sendErrorResponse(res, 401, "Token expired");
      return;
    }
    console.error("JWT verification error:", err);
    // res.status(401).json({ message: "Unauthorized access" });
    sendErrorResponse(res, 401, "Unauthorized access");
    return;
  }
};

// 🔐 Middleware: Role-based Authorization
export const authorizeRoles =
  (...allowedRoles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      sendErrorResponse(res, 403, "Forbidden:You Don't have Permission");
    }

    next();
  };

// 🔧 JWT Generator
export const generateToken = (
  userId: string,
  role: string,
  adminId?: string
): string => {
  const payload: JwtPayload = {
    id: userId,
    role,
    ...(adminId && { adminId }),
  };

  return jwt.sign(payload, _secret, {
    expiresIn: "1d",
    algorithm: "HS256",
  });
};

// 🍪 AuthCookie
export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie("rJmkUxzNakU", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    // maxAge: 3600000, // 1 hour
    maxAge: 86400000, // 1 day = 24 * 60 * 60 * 1000 milliseconds / 30 days = 30 * 24 * 60 * 60 * 1000 milliseconds
  });
};
