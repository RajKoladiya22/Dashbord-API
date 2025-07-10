"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFeedback = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const zod_1 = require("../../core/utils/zod");
const addFeedback = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const parsed = zod_1.feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { rating, feedback } = parsed.data;
    try {
        console.log(user);
        const addFeedback = await database_config_1.prisma.$transaction(async (tx) => {
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
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "feedback created", {
            feedback: addFeedback,
        });
        return;
    }
    catch (err) {
        console.error("addFeedback error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.addFeedback = addFeedback;
//# sourceMappingURL=feedback.controller.js.map