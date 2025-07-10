import { prisma } from "../../config/database.config";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../core/utils/responseHandler";
import { feedbackSchema, FeedbackSchema_ } from "../../core/utils/zod";
import { Request, Response, NextFunction } from "express";

export const addFeedback = async (
  req: Request<{}, {}, FeedbackSchema_>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // console.log(req.body);

  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  // console.log(user);

  const adminId = user.role === "admin" ? user.id : user.adminId;
  if (!adminId) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  // console.log(adminId);

  // Validate request body
  const parsed = feedbackSchema.safeParse(req.body);

  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }
  // console.log(parsed);

  const { rating, feedback } = parsed.data;

  try {
    // Wrap in a transaction to ensure all-or-nothing
  console.log(user);
    const addFeedback = await prisma.$transaction(async (tx) => {
      return tx.feedback.create({
        data: {
          userId: user.id,
          rating,
          feedback,
        },
        select: {
          id: true,
          userId: true,
          rating: true,
          feedback: true,
          createdAt: true,
        },
      });
    });
    console.log(addFeedback);

    sendSuccessResponse(res, 201, "feedback created", {
      feedback: addFeedback,
    });
    return;
  } catch (err) {
    console.error("addFeedback error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};
