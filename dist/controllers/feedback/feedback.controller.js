"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFeedbacks = exports.addFeedback = void 0;
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
<<<<<<< HEAD
    if ((!req.body.rating && !req.body.feedback) ||
        (req.body.rating === undefined && req.body.feedback === undefined)) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Please provide your feedback!");
        return;
    }
    const parsed = zod_1.feedbackSchema.safeParse(req.body);
=======
    const parsed = zod_1.addFeedbackSchema.safeParse(req.body);
>>>>>>> 615b86a (Error solve in Bulk Customer Controller)
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
const listFeedbacks = async (req, res, next) => {
    var _a;
    const user = req.user;
<<<<<<< HEAD
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const q = (_a = req.query.q) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    try {
        const [total, feedbacks] = await database_config_1.prisma.$transaction([
            database_config_1.prisma.feedback.count(),
            database_config_1.prisma.feedback.findMany({
                orderBy: { createdAt: "desc" },
=======
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const q = (_a = req.query.q) === null || _a === void 0 ? void 0 : _a.trim();
    try {
        const [total, feedback] = await database_config_1.prisma.$transaction([
            database_config_1.prisma.feedback.count(),
            database_config_1.prisma.feedback.findMany({
>>>>>>> 615b86a (Error solve in Bulk Customer Controller)
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
<<<<<<< HEAD
        const feedbackRes = [];
        let userProfile = {};
        await Promise.all(feedbacks.map(async (fb) => {
            switch (fb.user.role) {
                case "admin":
                    userProfile = await database_config_1.prisma.admin.findUnique({
                        where: { id: fb.user.userProfileId },
                        select: { firstName: true, lastName: true },
                    });
                    break;
                case "partner":
                    userProfile = await database_config_1.prisma.partner.findUnique({
                        where: { id: fb.user.userProfileId },
                        select: { firstName: true, lastName: true },
                    });
                    break;
                case "team_member":
                case "sub_admin":
                    userProfile = await database_config_1.prisma.teamMember.findUnique({
                        where: { id: fb.user.userProfileId },
                        select: { firstName: true, lastName: true },
                    });
                    break;
                default:
                    throw new Error("Unsupported role");
            }
            const fullName = `${userProfile.firstName} ${userProfile.lastName}`.toLowerCase();
            if (q && !fullName.includes(q))
                return;
            feedbackRes.push({
                id: fb.id,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                role: fb.user.role,
                rating: fb.rating,
                feedback: fb.feedback,
                createdAt: fb.createdAt,
            });
        }));
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Feedbacks fetched", {
            feedbacks: feedbackRes,
            meta: { total },
        });
=======
        console.log(total);
        console.log(feedback);
>>>>>>> 615b86a (Error solve in Bulk Customer Controller)
    }
    catch (err) {
        console.error("listFeedbacks error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        next(err);
    }
};
exports.listFeedbacks = listFeedbacks;
//# sourceMappingURL=feedback.controller.js.map