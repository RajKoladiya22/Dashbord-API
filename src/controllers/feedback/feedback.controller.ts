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

  if (
    (!req.body.rating && !req.body.feedback) ||
    (req.body.rating === undefined && req.body.feedback === undefined)
  ) {
    sendErrorResponse(res, 400, "Please provide your feedback!");
    return;
  }

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

export const listFeedbacks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user || user.role !== "super_admin") {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  // Search
  const q = (req.query.q as string)?.trim().toLowerCase();

  try {
    // if (q) const userName: any = { contains: q, mode: "insensitive" };
    // Fetch total & items in parallel
    const [total, feedbacks] = await prisma.$transaction([
      prisma.feedback.count(),
      prisma.feedback.findMany({
        // where: {  },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          feedback: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              role: true,
              userProfileId: true,
            },
          },
        },
      }),
    ]);
    // console.log(total);
    // console.log(feedbacks);

    // Final Response
    const feedbackRes: any = [];

    let userProfile: any = {};
    await Promise.all(
      feedbacks.map(async (fb) => {
        switch (fb.user.role) {
          case "admin":
            userProfile = await prisma.admin.findUnique({
              where: { id: fb.user.userProfileId },
              select: { firstName: true, lastName: true },
            });
            break;
          case "partner":
            userProfile = await prisma.partner.findUnique({
              where: { id: fb.user.userProfileId },
              select: { firstName: true, lastName: true },
            });
            break;
          case "team_member":
          case "sub_admin":
            userProfile = await prisma.teamMember.findUnique({
              where: { id: fb.user.userProfileId },
              select: { firstName: true, lastName: true },
            });
            break;
          default:
            throw new Error("Unsupported role");
        }
        // If q is passed, filter by name
        const fullName =
          `${userProfile.firstName} ${userProfile.lastName}`.toLowerCase();
        if (q && !fullName.includes(q)) return;

        feedbackRes.push({
          id: fb.id,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          role: fb.user.role,
          rating: fb.rating,
          feedback: fb.feedback,
          createdAt: fb.createdAt,
        });
      })
    );
    // console.log(feedbackRes);

    sendSuccessResponse(res, 201, "Feedbacks fetched", {
      feedbacks: feedbackRes,
      meta: { total },
    });
  } catch (err) {
    console.error("listFeedbacks error:", err);
    sendErrorResponse(res, 500, "Server error");
    next(err);
  }
};
