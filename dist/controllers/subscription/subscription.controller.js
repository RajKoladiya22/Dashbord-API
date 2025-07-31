"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSubscriptionHistory = exports.inactiveSubscription = exports.extendSubscription = exports.unblockSubscription = exports.deleteSubscription = exports.resumeSubscription = exports.suspendSubscription = exports.cancelSubscription = exports.disapproveSubscription = exports.approveSubscription = exports.listAllSubscriptions = exports.purchaseSubscription = void 0;
const date_fns_1 = require("date-fns");
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const zod_1 = require("../../core/utils/zod");
const nodemailer_1 = __importDefault(require("nodemailer"));
const SMTP_USER = database_config_1.env.SMTP_USER || "magicallydev@gmail.com";
const SMTP_PASS = database_config_1.env.SMTP_PASS || "vkdd frwe seja frlb";
if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in environment variables.");
}
const mailtransport = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: "magicallydev@gmail.com",
        pass: "vkdd frwe seja frlb",
    },
});
const purchaseSubscription = async (req, res, next) => {
    const parsed = zod_1.purchaseSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
        console.error("Validation failed with errors: ", parsed.error.errors);
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { planId, currency, paymentMethod, transactionId, paymentImage, accountHolder } = parsed.data;
    const user = req.user;
    if (!user || user.role !== "admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    const now = new Date();
    try {
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const plan = await tx.plan.findFirst({
                where: { id: planId, status: true },
                select: {
                    id: true,
                    price: true,
                    duration: true,
                }
            });
            if (!plan)
                throw new Error("Plan not found");
            const oldWithSamePlan = await tx.subscription.findFirst({
                where: { adminId, planId },
            });
            if (oldWithSamePlan && !["expired"].includes(oldWithSamePlan.status)) {
                (0, responseHandler_1.sendErrorResponse)(res, 409, `You already have a ${oldWithSamePlan.status} subscription for this plan.`);
                return;
            }
            const existingSubscription = await tx.subscription.findFirst({
                where: { adminId },
                select: { id: true, endsAt: true, status: true }
            });
            if (existingSubscription && !["active", "free_trial", "pending", "expired"].includes(existingSubscription.status)) {
                (0, responseHandler_1.sendErrorResponse)(res, 409, `Your old subscription is ${existingSubscription.status} so you can't purchase new subscription.`);
                return;
            }
            const startDate = (existingSubscription === null || existingSubscription === void 0 ? void 0 : existingSubscription.endsAt) && existingSubscription.endsAt > now ? existingSubscription.endsAt : now;
            const endDate = (0, date_fns_1.addDays)(startDate, Number(plan.duration));
            const subscription = (existingSubscription) ?
                await tx.subscription.update({
                    where: { id: existingSubscription.id },
                    data: {
                        planId: plan.id,
                        status: "pending",
                        renewedAt: startDate,
                        endsAt: endDate,
                    },
                    select: {
                        id: true,
                        status: true,
                        startsAt: true,
                        plan: {
                            select: {
                                id: true,
                                name: true,
                                duration: true,
                                price: true,
                            }
                        }
                    }
                }) :
                await tx.subscription.create({
                    data: {
                        adminId,
                        planId: plan.id,
                        status: "pending",
                        startsAt: startDate,
                        endsAt: endDate,
                    },
                    select: {
                        id: true,
                        status: true,
                        startsAt: true,
                        plan: {
                            select: {
                                id: true,
                                name: true,
                                duration: true,
                                price: true,
                            }
                        }
                    }
                });
            await tx.subscriptionPayment.create({
                data: {
                    subscriptionId: subscription.id,
                    amount: plan.price,
                    currency,
                    paidAt: now,
                    status: "success",
                    paymentMethod,
                    gatewayResponse: {
                        accountHolder,
                        transactionId,
                        paymentImage,
                    },
                },
            });
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: subscription.id,
                    eventType: "subscription_purchased",
                    eventAt: now,
                    metadata: {
                        by: "admin",
                        source: "web",
                        message: `Purchase subscription via ${paymentMethod}`,
                    },
                },
            });
            return subscription;
        });
        if (!result)
            return;
        const admin = await database_config_1.prisma.admin.findFirst({
            where: { id: adminId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
            },
        });
        if (result && admin) {
            const adminFullName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || "Admin";
            const mailOptions = {
                from: SMTP_USER,
                to: admin.email,
                subject: "Subscription Purchase - Pending Approval",
                html: `
                    <div style="max-width:600px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #e0e0e0;border-radius:8px;">
                    <div style="text-align:center;margin-bottom:24px;">
                        <h2 style="margin:0;">Subscription Pending ⏳</h2>
                        <p style="font-size:16px;color:#555;margin-top:8px;">Thanks for your purchase, ${adminFullName}!</p>
                    </div>

                    <div style="font-size:15px;line-height:1.6;">
                        <p>Your subscription is currently <strong>pending approval</strong>.</p>
                        <p>A Super Admin will review your request shortly. You will be notified once it’s approved and activated.</p>
                    </div>

                    <table style="width:100%;margin-top:24px;border-collapse:collapse;">
                        <tr>
                        <td style="padding:8px 0;font-weight:bold;color:#555;">Plan Name:</td>
                        <td style="padding:8px 0;color:#333;">${result.plan.name}</td>
                        </tr>
                        <tr>
                        <td style="padding:8px 0;font-weight:bold;color:#555;">Amount:</td>
                        <td style="padding:8px 0;color:#333;">₹${result.plan.price}</td>
                        </tr>
                        <tr>
                        <td style="padding:8px 0;font-weight:bold;color:#555;">Purchase Date:</td>
                        <td style="padding:8px 0;color:#333;">${new Date(result.startsAt).toLocaleString()}</td>
                        </tr>
                    </table>

                    <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                    <div style="font-size:14px;color:#666;text-align:left;">
                        <p>Thank you for choosing CPM.</p>
                        <p>Regards,</p>
                        <p><strong>CPM Team</strong></p>
                        <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                    </div>
                    </div>
                `
            };
            mailtransport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Email sending failed...", error);
                }
                else {
                    console.log("Email sent successfully...", info.response);
                }
            });
        }
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription purchased successfully", { subscription: result });
    }
    catch (err) {
        console.error("purchaseSubscription error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.purchaseSubscription = purchaseSubscription;
const listAllSubscriptions = async (req, res, next) => {
    var _a, _b;
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const q = (_a = req.query.q) === null || _a === void 0 ? void 0 : _a.trim();
    const searchFilter = q
        ? {
            OR: [
                { admin: { firstName: { contains: q, mode: "insensitive" } } },
                { admin: { lastName: { contains: q, mode: "insensitive" } } },
                { admin: { email: { contains: q, mode: "insensitive" } } },
                { admin: { companyName: { contains: q, mode: "insensitive" } } },
                { plan: { name: { contains: q, mode: "insensitive" } } },
            ],
        }
        : {};
    const status = req.query.status;
    const statusFilter = status ? { status } : { status: "active" };
    const allowedSortFields = ["startsAt", "endsAt", "status", "renewedAt", "cancelledAt", "createdAt"];
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = ((_b = req.query.sortOrder) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "asc" ? "asc" : "desc";
    if (!allowedSortFields.includes(sortBy)) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`);
        return;
    }
    const baseFilter = { ...searchFilter, ...statusFilter, };
    try {
        const [total, subscriptions] = await Promise.all([
            database_config_1.prisma.subscription.count({ where: baseFilter }),
            database_config_1.prisma.subscription.findMany({
                where: baseFilter,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    status: true,
                    startsAt: true,
                    endsAt: true,
                    renewedAt: true,
                    cancelledAt: true,
                    createdAt: true,
                    updatedAt: true,
                    admin: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            companyName: true,
                            contactInfo: true,
                        },
                    },
                    plan: {
                        select: {
                            id: true,
                            name: true,
                            duration: true,
                            price: true,
                        },
                    },
                    payments: {
                        orderBy: { paidAt: "desc" },
                        take: 1,
                        select: {
                            id: true,
                            amount: true,
                            currency: true,
                            paidAt: true,
                            status: true,
                            paymentMethod: true,
                            gatewayResponse: true,
                        },
                    },
                },
            }),
        ]);
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscriptions fetched", {
            subscriptions,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        console.error("listAllSubscriptions error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.listAllSubscriptions = listAllSubscriptions;
const approveSubscription = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    const now = new Date();
    try {
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });
        if (!subscription) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
            return;
        }
        if (!["pending", "blocked"].includes(subscription.status)) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, `Cannot approve a subscription with status: ${subscription.status}`);
            return;
        }
        await database_config_1.prisma.$transaction(async (tx) => {
            await tx.subscription.update({
                where: { id, adminId, planId },
                data: {
                    status: "active",
                    startsAt: now,
                    endsAt: (0, date_fns_1.addDays)(now, Number(subscription.plan.duration)),
                },
            });
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: subscription.id,
                    eventType: "subscription_approved",
                    eventAt: now,
                    metadata: {
                        by: "super_admin",
                        source: "web",
                        message: "approve pending subscription",
                    },
                },
            });
            if (subscription.admin) {
                const mailOptions = {
                    from: SMTP_USER,
                    to: subscription.admin.email,
                    subject: "Subscription Approved - Welcome to the Plan!",
                    html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Approved ✅</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${subscription.admin.firstName} ${subscription.admin.lastName}</strong>,</p>

                            <p>Your subscription to the <strong>${subscription.plan.name}</strong> plan has been <span style="color:green;font-weight:bold;">approved</span> and is now <strong>active</strong>.</p>

                            <p>You can now access all the features included in your plan.</p>

                            <p style="margin-top:20px;">Thank you for choosing our service!</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription approved successfully");
        return;
    }
    catch (error) {
        console.error("Error approving subscription:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
        return;
    }
};
exports.approveSubscription = approveSubscription;
const disapproveSubscription = async (req, res, next) => {
    const user = req.user;
    console.log(user);
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    const now = new Date();
    try {
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: {
                admin: true,
                plan: true,
            },
        });
        if (!subscription) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
            return;
        }
        if (subscription.status !== "pending") {
            (0, responseHandler_1.sendErrorResponse)(res, 400, "Only pending subscriptions can be disapproved");
            return;
        }
        await database_config_1.prisma.$transaction(async (tx) => {
            await tx.subscription.update({
                where: { id },
                data: {
                    status: "blocked",
                },
            });
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: subscription.id,
                    eventType: "subscription_disapproved(blocked)",
                    eventAt: now,
                    metadata: {
                        by: "super_admin",
                        source: "web",
                        message: "disapprove(block) pending subscription",
                    },
                },
            });
            if (subscription.admin) {
                const mailOptions = {
                    from: SMTP_USER,
                    to: subscription.admin.email,
                    subject: "Your subscription request has been disapproved",
                    html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Disapproved ❌</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${subscription.admin.firstName} ${subscription.admin.lastName}</strong>,</p>

                            <p>We regret to inform you that your subscription request for the <strong>${subscription.plan.name}</strong> plan has been <span style="color:red;font-weight:bold;">disapproved</span>.</p>

                            <p>If you believe this decision was made in error or require further clarification, please don't hesitate to contact our support team.</p>

                            <p style="margin-top:20px;">We appreciate your interest in our service.</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription disapproved(blocked) successfully");
        return;
    }
    catch (error) {
        console.error("Error disapproving subscription:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
        return;
    }
};
exports.disapproveSubscription = disapproveSubscription;
const cancelSubscription = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    const now = new Date();
    try {
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });
        if (!subscription) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
            return;
        }
        if (!["active", "free_trial"].includes(subscription.status)) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, `Cannot cancel a subscription with status: ${subscription.status}`);
            return;
        }
        await database_config_1.prisma.$transaction(async (tx) => {
            await tx.subscription.update({
                where: { id, adminId, planId },
                data: {
                    status: "canceled",
                    cancelledAt: now,
                },
            });
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: subscription.id,
                    eventType: "subscription_canceled",
                    eventAt: now,
                    metadata: {
                        by: "super_admin",
                        source: "web",
                        message: `cancel ${subscription.status} subscription`,
                    },
                },
            });
            if (subscription.admin) {
                const mailOptions = {
                    from: SMTP_USER,
                    to: subscription.admin.email,
                    subject: "Your subscription has been cancelled",
                    html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Cancelled ❌</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${subscription.admin.firstName} ${subscription.admin.lastName}</strong>,</p>

                            <p>Your subscription to the <strong>${subscription.plan.name}</strong> plan has been <span style="color:red;font-weight:bold;">cancelled</span>.</p>

                            <p>You will no longer have access to the features of this plan. If this was a mistake or you have any concerns, please contact our support team.</p>

                            <p style="margin-top:20px;">Thank you for being with us.</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription cancelled successfully");
        return;
    }
    catch (error) {
        console.error("Error cancelling subscription:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
        return;
    }
};
exports.cancelSubscription = cancelSubscription;
const suspendSubscription = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    const now = new Date();
    try {
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });
        if (!subscription) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
            return;
        }
        if (!["active", "free_trial"].includes(subscription.status)) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, `Cannot suspend subscription with status '${subscription.status}'`);
            return;
        }
        await database_config_1.prisma.$transaction(async (tx) => {
            await tx.subscription.update({
                where: { id, adminId, planId },
                data: {
                    status: "suspended",
                },
            });
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: subscription.id,
                    eventType: "subscription_suspended",
                    eventAt: now,
                    metadata: {
                        by: "super_admin",
                        source: "web",
                        message: `suspend ${subscription.status} subscription`,
                    },
                },
            });
            if (subscription.admin) {
                const mailOptions = {
                    from: SMTP_USER,
                    to: subscription.admin.email,
                    subject: "Your subscription has been suspended",
                    html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Suspended ⏸️</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${subscription.admin.firstName} ${subscription.admin.lastName}</strong>,</p>

                            <p>Your subscription to the <strong>${subscription.plan.name}</strong> plan has been <span style="color:orange;font-weight:bold;">suspended</span>.</p>

                            <p>During suspension, access to your plan features will be temporarily restricted.</p>

                            <p style="margin-top:20px;">If you believe this action was taken in error or need help, please contact our support team.</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription suspended successfully");
        return;
    }
    catch (error) {
        console.error("Error suspending subscription:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
        return;
    }
};
exports.suspendSubscription = suspendSubscription;
const resumeSubscription = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    const now = new Date();
    try {
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });
        if (!subscription) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
            return;
        }
        if (!["suspended", "canceled", "inactive", "past_due", "under_review"].includes(subscription.status)) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, `Cannot resume subscription with status '${subscription.status}'`);
            return;
        }
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const freePlan = await tx.plan.findFirst({
                where: { name: "Basic", duration: "30" },
            });
            if (!freePlan)
                throw new Error("Free plan not found");
            if (freePlan.id === subscription.planId) {
                await tx.subscription.update({
                    where: { id, adminId, planId },
                    data: {
                        status: "free_trial",
                    },
                });
                await tx.subscriptionEvent.create({
                    data: {
                        subscriptionId: subscription.id,
                        eventType: "subscription_resumed(free_trial)",
                        eventAt: now,
                        metadata: {
                            by: "super_admin",
                            source: "web",
                            message: `resume(free_trial) ${subscription.status} subscription`,
                        },
                    },
                });
            }
            else {
                await tx.subscription.update({
                    where: { id, adminId, planId },
                    data: {
                        status: "active",
                    },
                });
                await tx.subscriptionEvent.create({
                    data: {
                        subscriptionId: subscription.id,
                        eventType: "subscription_resumed(active)",
                        eventAt: now,
                        metadata: {
                            by: "super_admin",
                            source: "web",
                            message: `resume(active) ${subscription.status} subscription`,
                        },
                    },
                });
            }
            if (subscription.admin) {
                const mailOptions = {
                    from: SMTP_USER,
                    to: subscription.admin.email,
                    subject: "Your subscription has been resumed",
                    html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Resumed 🔄</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${subscription.admin.firstName} ${subscription.admin.lastName}</strong>,</p>

                            <p>Your subscription to the <strong>${subscription.plan.name}</strong> plan has been <span style="color:green;font-weight:bold;">resumed</span> and is now <strong>active</strong>.</p>

                            <p>You now have full access to all the features included in your plan.</p>

                            <p style="margin-top:20px;">We're glad to have you back. Thank you for continuing with our service!</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
            if (freePlan.id === subscription.planId) {
                return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription resumed(free_trial) successfully");
            }
            else {
                return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription resumed(active) successfully");
            }
        });
        if (!result)
            return;
    }
    catch (error) {
        console.error("Error resuming subscription:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
        return;
    }
};
exports.resumeSubscription = resumeSubscription;
const deleteSubscription = async (req, res, next) => {
    const user = req.user;
    console.log(user);
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    const now = new Date();
    try {
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });
        if (!subscription) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
            return;
        }
        if (!["blocked", "canceled", "inactive", "expired", "suspended"].includes(subscription.status)) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, `Cannot delete subscription with status '${subscription.status}'`);
            return;
        }
        await database_config_1.prisma.$transaction(async (tx) => {
            await tx.subscription.delete({
                where: { id, adminId, planId },
            });
            if (subscription && subscription.admin) {
                const adminFullName = [subscription.admin.firstName, subscription.admin.lastName].filter(Boolean).join(" ") || "Admin";
                const mailOptions = {
                    from: SMTP_USER,
                    to: subscription.admin.email,
                    subject: `Your Subscription Has Been Deleted`,
                    html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Deleted ❌</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${adminFullName}</strong>,</p>

                            <p>Your subscription to the <strong>${subscription.plan.name}</strong> plan has been <span style="color:red;font-weight:bold;">deleted</span>.</p>

                            <table style="width:100%;margin-top:20px;border-collapse:collapse;">
                                <thead>
                                    <tr style="background-color:#f9f9f9;text-align:left;">
                                        <th style="padding:10px;border:1px solid #ddd;">Plan Name</th>
                                        <th style="padding:10px;border:1px solid #ddd;">Status</th>
                                        <th style="padding:10px;border:1px solid #ddd;">Deleted By</th>
                                        <th style="padding:10px;border:1px solid #ddd;">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding:10px;border:1px solid #ddd;">${subscription.plan.name}</td>
                                        <td style="padding:10px;border:1px solid #ddd;">${subscription.status}</td>
                                        <td style="padding:10px;border:1px solid #ddd;">Super Admin</td>
                                        <td style="padding:10px;border:1px solid #ddd;">Deleted due to status <strong>${subscription.status}</strong></td>
                                    </tr>
                                </tbody>
                            </table>

                            <p style="margin-top:20px;">If you believe this was done in error or have any questions, please don't hesitate to reach out to our support team.</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription deleted successfully");
        return;
    }
    catch (error) {
        console.error("Error deleting subscription:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
        return;
    }
};
exports.deleteSubscription = deleteSubscription;
const unblockSubscription = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    try {
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const subscription = await tx.subscription.findFirst({
                where: { id, adminId, planId },
                include: { admin: true, plan: true },
            });
            if (!subscription) {
                (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
                return;
            }
            if (subscription.status !== "blocked") {
                (0, responseHandler_1.sendErrorResponse)(res, 400, "Subscription is not blocked");
                return;
            }
            const freePlan = await tx.plan.findFirst({
                where: { name: "Basic", duration: "30" },
            });
            if (!freePlan)
                throw new Error("Free plan not found");
            if (freePlan.id === subscription.planId) {
                await tx.subscription.update({
                    where: { id, adminId, planId },
                    data: {
                        status: "free_trial",
                    },
                });
                await tx.subscriptionEvent.create({
                    data: {
                        subscriptionId: subscription.id,
                        eventType: "subscription_unblocked(free_trial)",
                        eventAt: new Date(),
                        metadata: {
                            by: "super_admin",
                            source: "web",
                            message: `unblock(free_trial) blocked subscription`,
                        },
                    },
                });
            }
            else {
                await tx.subscription.update({
                    where: { id, adminId, planId },
                    data: {
                        status: "active",
                    },
                });
                await tx.subscriptionEvent.create({
                    data: {
                        subscriptionId: subscription.id,
                        eventType: "subscription_unblocked(active)",
                        eventAt: new Date(),
                        metadata: {
                            by: "super_admin",
                            source: "web",
                            message: `unblock(active) blocked subscription`,
                        },
                    },
                });
            }
            if (subscription && subscription.admin) {
                const adminFullName = [subscription.admin.firstName, subscription.admin.lastName].filter(Boolean).join(" ") || "Admin";
                const mailOptions = {
                    from: SMTP_USER,
                    to: subscription.admin.email,
                    subject: "Your Subscription Has Been Unblocked",
                    html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Unblocked ✅</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${adminFullName}</strong>,</p>

                            <p>Your subscription to the <strong>${subscription.plan.name}</strong> plan has been <span style="color:green;font-weight:bold;">unblocked</span> and is now <strong>active</strong>.</p>

                            <p>You can now resume full access to all the features included in your plan.</p>

                            <p style="margin-top:10px;"><strong>New End Date:</strong> ${subscription.endsAt.toDateString()}</p>

                            <p style="margin-top:20px;">Thank you for staying with us!</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
            if (freePlan.id === subscription.planId) {
                return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription unblocked(free_trial) successfully");
            }
            else {
                return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription unblocked(active) successfully");
            }
        });
        if (!result)
            return;
    }
    catch (error) {
        console.error("Error unblocking subscription:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
};
exports.unblockSubscription = unblockSubscription;
const extendSubscription = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    try {
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const freePlan = await tx.plan.findFirst({
                where: { name: "Basic", duration: "30" },
            });
            if (!freePlan)
                throw new Error("Free plan not found");
            const subscription = await tx.subscription.findFirst({
                where: { id, adminId, status: { not: "expired" } },
                orderBy: { endsAt: "desc" },
                include: {
                    plan: true,
                },
            });
            if (subscription) {
                (0, responseHandler_1.sendErrorResponse)(res, 400, "He has an already purchased subscription");
                return;
            }
            const now = new Date();
            const newEndsAt = (0, date_fns_1.addDays)(now, Number(freePlan.duration));
            const updated = await tx.subscription.update({
                where: { id, adminId },
                data: {
                    planId: freePlan.id,
                    renewedAt: now,
                    endsAt: newEndsAt,
                    status: "active",
                },
            });
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: updated.id,
                    eventType: "subscription_extended",
                    eventAt: now,
                    metadata: {
                        by: "super_admin",
                        source: "web",
                        message: "extend(active for free plan) expired subscription",
                    },
                },
            });
            return updated;
        });
        if (!result)
            return;
        const admin = await database_config_1.prisma.admin.findFirst({
            where: { id: adminId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
            },
        });
        if (result && admin) {
            const adminFullName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || "Admin";
            const mailOptions = {
                from: SMTP_USER,
                to: admin.email,
                subject: "Your Subscription Has Been Extended",
                html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Extended ✅</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${adminFullName}</strong>,</p>

                            <p>Your subscription to the <strong>Basic</strong> plan has been <span style="color:green;font-weight:bold;">extended</span> and is now <strong>active</strong>.</p>

                            <p><strong>New End Date:</strong> ${result.endsAt.toDateString()}</p>

                            <p>You can now continue using all features included in your plan without interruption.</p>

                            <p style="margin-top:20px;">Thank you for staying with us!</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
            };
            mailtransport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Email sending failed...", error);
                }
                else {
                    console.log("Email sent successfully...", info.response);
                }
            });
            (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription extended successfully");
        }
        else if (result && !admin) {
            (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription extended successfully, but Email not sent");
        }
        else {
            (0, responseHandler_1.sendErrorResponse)(res, 400, "Failed to Extend Subscription----");
        }
    }
    catch (err) {
        console.error("extendSubscription error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.extendSubscription = extendSubscription;
const inactiveSubscription = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id, adminId, planId } = req.params;
    if (!id || !adminId || !planId) {
        (0, responseHandler_1.sendErrorResponse)(res, 404, "Invalid input");
        return;
    }
    try {
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });
        if (!subscription) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
            return;
        }
        if (!["active", "free_trial"].includes(subscription.status)) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, `Only active subscriptions can be inactive`);
            return;
        }
        await database_config_1.prisma.$transaction(async (tx) => {
            await tx.subscription.update({
                where: { id, adminId, planId },
                data: {
                    status: "inactive",
                },
            });
            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: subscription.id,
                    eventType: "subscription_inactive",
                    eventAt: new Date(),
                    metadata: {
                        by: "super_admin",
                        source: "web",
                        message: `inactive ${subscription.status} subscription`,
                    },
                },
            });
            if (subscription.admin) {
                const adminFullName = [subscription.admin.firstName, subscription.admin.lastName].filter(Boolean).join(" ") || "Admin";
                const mailOptions = {
                    from: SMTP_USER,
                    to: subscription.admin.email,
                    subject: "Your subscription has been inactivated",
                    html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#333;border:1px solid #ddd;border-radius:8px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <h2>Subscription Inactivated ❌</h2>
                        </div>

                        <div style="font-size:16px;">
                            <p>Hi <strong>${adminFullName}</strong>,</p>

                            <p>Your subscription to the <strong>${subscription.plan.name}</strong> plan has been <span style="color:red;font-weight:bold;">inactivated</span>.</p>

                            <p>You will not be able to access the features associated with this plan while it is inactive.</p>

                            <p>If you believe this was a mistake or have any questions, please reach out to our support team.</p>
                        </div>

                        <hr style="margin:30px 0;border:0;border-top:1px solid #eee;" />

                        <div style="font-size:14px;color:#666;text-align:left;">
                            <p>Regards,</p>
                            <p><strong>CPM Team</strong></p>
                            <p style="margin-top:5px;">Need help? Feel free to contact our support team</p>
                        </div>
                    </div>
                `
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription inactive successfully");
        return;
    }
    catch (error) {
        console.error("Error inactivating subscription:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
        return;
    }
};
exports.inactiveSubscription = inactiveSubscription;
const adminSubscriptionHistory = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    try {
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: { adminId: user.id },
            select: { id: true },
        });
        if (!subscription) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription not found");
            return;
        }
        const events = await database_config_1.prisma.subscriptionEvent.findMany({
            where: {
                subscriptionId: subscription.id,
                eventType: {
                    in: ["subscription_created", "subscription_approved", "subscription_extended"]
                }
            },
            orderBy: { eventAt: "desc" },
            select: {
                id: true,
                subscription: {
                    select: {
                        id: true,
                        startsAt: true,
                        endsAt: true,
                        renewedAt: true,
                        cancelledAt: true,
                        plan: {
                            select: {
                                id: true,
                                name: true,
                                duration: true,
                                price: true,
                                offers: true,
                                specs: true,
                                descriptions: true,
                            }
                        }
                    }
                }
            },
        });
        if (!events) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Subscription events not found");
            return;
        }
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Admin subscription history fetched", {
            subscriptions: events.map(event => event.subscription),
        });
    }
    catch (error) {
        console.error("Error fetching subscription history:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
};
exports.adminSubscriptionHistory = adminSubscriptionHistory;
//# sourceMappingURL=subscription.controller.js.map