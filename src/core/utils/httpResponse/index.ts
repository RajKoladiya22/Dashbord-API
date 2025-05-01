// core/utils/responseHandler.ts
import { Response } from "express";

// Success Response
export const sendSuccessResponse = (
  res: Response,
  status: number,
  message: string,
  data: any = {}
) => {
  return res.status(status).json({
    status,
    success: true,
    message,
    data,
  });
};

// Error Response
export const sendErrorResponse = (
  res: Response,
  status: number,
  message: string,
  errors: any = {}
) => {
  return res.status(status).json({
    status,
    success: false,
    message,
    errors,
  });
};