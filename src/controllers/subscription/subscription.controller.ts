import { addDays } from "date-fns";
import { env, prisma } from "../../config/database.config";
import { sendErrorResponse, sendSuccessResponse } from "../../core/utils/responseHandler";
import { purchaseSubscriptionSchema, PurchaseSubscriptionSchema_ } from "../../core/utils/zod";
import { Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";

const SMTP_USER = env.SMTP_USER || "magicallydev@gmail.com";
const SMTP_PASS = env.SMTP_PASS || "vkdd frwe seja frlb";

if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in environment variables.");
}

const mailtransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        // user: SMTP_USER,
        // pass: SMTP_PASS,
        user: "magicallydev@gmail.com",
        pass: "vkdd frwe seja frlb",
    },
});

// Purchase and listing
export const purchaseSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // Validate request body
    const parsed = purchaseSubscriptionSchema.safeParse(req.body);

    if (!parsed.success) {
        console.error("Validation failed with errors: ", parsed.error.errors);
        sendErrorResponse(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }

    const {
        planId,
        currency,
        paymentMethod,
        transactionId,
        paymentImage,
        accountHolder
    }: PurchaseSubscriptionSchema_ = parsed.data;

    // Determine adminId from the authenticated user
    const user = req.user as { id: string; role: string; adminId?: string };
    if (!user || user.role !== "admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId!;
    const now = new Date();

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Find Plan
            const plan = await tx.plan.findFirst({
                where: { id: planId, status: true },
                select: {
                    id: true,
                    price: true,
                    duration: true,
                }
            })
            if (!plan) throw new Error("Plan not found");

            // check : Already subscribed to this plan
            const oldWithSamePlan = await tx.subscription.findFirst({
                where: { adminId, planId },
            });

            if (oldWithSamePlan && !["expired"].includes(oldWithSamePlan.status)) {
                sendErrorResponse(res, 409, `You already have a ${oldWithSamePlan.status} subscription for this plan.`);
                return;
            }
            // console.log(oldWithSamePlan);

            // Find Subscription
            const existingSubscription = await tx.subscription.findFirst({
                where: { adminId },
                select: { id: true, endsAt: true, status: true }
            });

            if (existingSubscription && !["active", "free_trial", "pending", "expired"].includes(existingSubscription.status)) {
                sendErrorResponse(res, 409, `Your old subscription is ${existingSubscription.status} so you can't purchase new subscription.`);
                return;
            }

            const startDate = existingSubscription?.endsAt && existingSubscription.endsAt > now ? existingSubscription.endsAt : now;
            const endDate = addDays(startDate, Number(plan.duration));

            const subscription = (existingSubscription) ?
                // Update Subscription
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
                // Shouldn't occur since we always create a freetrial at signup
                // Create Subscription
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

            // Create Payment record
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

            // Create Subscription Event
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
        if (!result) return;

        // Fetch admin's email after transaction
        const admin = await prisma.admin.findFirst({
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
                } else {
                    console.log("Email sent successfully...", info.response);
                }
            });
        }

        sendSuccessResponse(res, 200, "Subscription purchased successfully", { subscription: result })
    } catch (err) {
        console.error("purchaseSubscription error:", err);
        sendErrorResponse(res, 500, "Server error");
    }
}

export const listAllSubscriptions = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    // Pagination
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    // Search
    const q = (req.query.q as string)?.trim();
    const searchFilter = q
        ? {
            OR: [
                { admin: { firstName: { contains: q, mode: "insensitive" } } },
                { admin: { lastName: { contains: q, mode: "insensitive" } } },
                { admin: { email: { contains: q, mode: "insensitive" } } },
                { admin: { companyName: { contains: q, mode: "insensitive" } } },
                // { admin: { contactInfo: { contactNumber: { contains: q, mode: "insensitive" } } } },
                { plan: { name: { contains: q, mode: "insensitive" } } },
            ],
        }
        : {};

    // Filter by status
    const status = req.query.status as string;
    const statusFilter = status ? { status } : { status: "active" };

    // Sorting
    // const allowedSortFields = ["firstName", "lastName", "email", "companyName"];
    // const sortBy = (req.query.sortBy as string) || "companyName";
    // const sortOrder: "asc" | "desc" =
    //     (req.query.sortOrder as string)?.toLowerCase() === "asc" ? "asc" : "desc";

    const allowedSortFields = ["startsAt", "endsAt", "status", "renewedAt", "cancelledAt", "createdAt"];
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder: "asc" | "desc" =
        (req.query.sortOrder as string)?.toLowerCase() === "asc" ? "asc" : "desc";

    if (!allowedSortFields.includes(sortBy)) {
        sendErrorResponse(res, 400, `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`);
        return;
    }

    // Final filter
    const baseFilter: any = { ...searchFilter, ...statusFilter, };

    try {
        const [total, subscriptions] = await Promise.all([
            prisma.subscription.count({ where: baseFilter }),
            prisma.subscription.findMany({
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

        sendSuccessResponse(res, 200, "Subscriptions fetched", {
            subscriptions,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error("listAllSubscriptions error:", err);
        sendErrorResponse(res, 500, "Server error");
    }
}

// handle all actions according to status
export const approveSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    const now = new Date();

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: {
                admin: true,
                plan: true,
                payments: true,
                events: true,
            },
        });

        if (!subscription) {
            sendErrorResponse(res, 404, "Subscription not found");
            return;
        }

        if (!["pending", "blocked"].includes(subscription.status)) {
            sendErrorResponse(res, 400, `Cannot approve a subscription with status: ${subscription.status}`);
            return;
        }

        await prisma.$transaction(async (tx) => {
            const approved = await tx.subscription.update({
                where: { id, adminId, planId },
                data: {
                    status: "active",
                    startsAt: now,
                    endsAt: addDays(now, Number(subscription.plan.duration)),
                },
                include: {
                    plan: true,
                    payments: true,
                    events: true,
                },
            });

            await tx.subscriptionEvent.create({
                data: {
                    subscriptionId: approved.id,
                    eventType: "subscription_approved",
                    eventAt: now,
                    metadata: {
                        by: "super_admin",
                        source: "web",
                        message: "approve pending subscription",
                        subscription: {
                            planId: approved.planId,
                            status: approved.status,
                            startsAt: approved.startsAt,
                            endsAt: approved.endsAt,
                            renewedAt: approved.renewedAt,
                            cancelledAt: approved.cancelledAt,
                            plan: approved.plan,
                            payments: approved.payments,
                            events: approved.events,
                        }
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
                    } else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });

        sendSuccessResponse(res, 200, "Subscription approved successfully");
        return;
    } catch (error) {
        console.error("Error approving subscription:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
        return;
    }
};

export const disapproveSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;
    console.log(user);

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    const now = new Date();

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: {
                admin: true,
                plan: true,
            },
        });

        if (!subscription) {
            sendErrorResponse(res, 404, "Subscription not found");
            return;
        }

        if (subscription.status !== "pending") {
            sendErrorResponse(res, 400, "Only pending subscriptions can be disapproved");
            return;
        }

        await prisma.$transaction(async (tx) => {
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
                    } else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });
        // console.log(res);

        sendSuccessResponse(res, 200, "Subscription disapproved(blocked) successfully");
        return;
    } catch (error) {
        console.error("Error disapproving subscription:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
        return;
    }
};

export const cancelSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    const now = new Date();

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });

        if (!subscription) {
            sendErrorResponse(res, 404, "Subscription not found");
            return;
        }

        if (!["active", "free_trial"].includes(subscription.status)) {
            sendErrorResponse(res, 400, `Cannot cancel a subscription with status: ${subscription.status}`);
            return;
        }

        await prisma.$transaction(async (tx) => {
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
                    } else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });

        sendSuccessResponse(res, 200, "Subscription cancelled successfully");
        return;
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
        return;
    }
};

export const suspendSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    const now = new Date();

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });

        if (!subscription) {
            sendErrorResponse(res, 404, "Subscription not found");
            return;
        }

        if (!["active", "free_trial"].includes(subscription.status)) {
            sendErrorResponse(res, 400, `Cannot suspend subscription with status '${subscription.status}'`);
            return;
        }

        await prisma.$transaction(async (tx) => {
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
                    } else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });

        sendSuccessResponse(res, 200, "Subscription suspended successfully");
        return;
    } catch (error) {
        console.error("Error suspending subscription:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
        return;
    }
};

export const resumeSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    const now = new Date();

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });

        if (!subscription) {
            sendErrorResponse(res, 404, "Subscription not found");
            return;
        }

        if (!["suspended", "canceled", "inactive", "past_due", "under_review"].includes(subscription.status)) {
            sendErrorResponse(res, 400, `Cannot resume subscription with status '${subscription.status}'`);
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const freePlan = await tx.plan.findFirst({
                where: { name: "Basic", duration: "30" },
            });
            if (!freePlan) throw new Error("Free plan not found");

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
            } else {
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
                    } else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }

            if (freePlan.id === subscription.planId) {
                return sendSuccessResponse(res, 200, "Subscription resumed(free_trial) successfully");
            } else {
                return sendSuccessResponse(res, 200, "Subscription resumed(active) successfully");
            }
        });

        if (!result) return;
    } catch (error) {
        console.error("Error resuming subscription:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
        return;
    }
};

export const deleteSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;
    console.log(user);

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    const now = new Date();

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });

        if (!subscription) {
            sendErrorResponse(res, 404, "Subscription not found");
            return;
        }

        if (!["blocked", "canceled", "inactive", "expired", "suspended"].includes(subscription.status)) {
            sendErrorResponse(res, 400, `Cannot delete subscription with status '${subscription.status}'`);
            return;
        }

        await prisma.$transaction(async (tx) => {
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
                    } else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });

        sendSuccessResponse(res, 200, "Subscription deleted successfully");
        return;
    } catch (error) {
        console.error("Error deleting subscription:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
        return;
    }
};

export const unblockSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const subscription = await tx.subscription.findFirst({
                where: { id, adminId, planId },
                include: { admin: true, plan: true },
            });

            if (!subscription) {
                sendErrorResponse(res, 404, "Subscription not found");
                return;
            }

            if (subscription.status !== "blocked") {
                sendErrorResponse(res, 400, "Subscription is not blocked");
                return;
            }

            const freePlan = await tx.plan.findFirst({
                where: { name: "Basic", duration: "30" },
            });
            if (!freePlan) throw new Error("Free plan not found");

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
            } else {
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

                            <p style="margin-top:10px;"><strong>New End Date:</strong> ${subscription.endsAt!.toDateString()}</p>

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
                    } else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }

            if (freePlan.id === subscription.planId) {
                return sendSuccessResponse(res, 200, "Subscription unblocked(free_trial) successfully");
            } else {
                return sendSuccessResponse(res, 200, "Subscription unblocked(active) successfully");
            }
        });
        if (!result) return;
    } catch (error) {
        console.error("Error unblocking subscription:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
    }
};

export const extendSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const freePlan = await tx.plan.findFirst({
                where: { name: "Basic", duration: "30" },
            });
            if (!freePlan) throw new Error("Free plan not found");

            const subscription = await tx.subscription.findFirst({
                where: { id, adminId, status: { not: "expired" } },
                orderBy: { endsAt: "desc" },
                include: {
                    plan: true,
                },
            });
            // console.log(subscription);

            if (subscription) {
                sendErrorResponse(res, 400, "He has an already purchased subscription");
                return;
            }

            const now = new Date();
            const newEndsAt = addDays(now, Number(freePlan.duration));

            const updated = await tx.subscription.update({
                where: { id, adminId },
                data: {
                    planId: freePlan.id,
                    renewedAt: now,
                    endsAt: newEndsAt,
                    status: "active",
                },
                include: {
                    plan: true,
                    payments: true,
                    events: true,
                }
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
                        subscription: {
                            planId: updated.planId,
                            status: updated.status,
                            startsAt: updated.startsAt,
                            endsAt: updated.endsAt,
                            renewedAt: updated.renewedAt,
                            cancelledAt: updated.cancelledAt,
                            plan: updated.plan,
                            payments: updated.payments,
                            events: updated.events,
                        }
                    },
                },
            });

            return updated;
        });
        // console.log(result);
        if (!result) return;

        // Fetch admin's email after transaction
        const admin = await prisma.admin.findFirst({
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

                            <p><strong>New End Date:</strong> ${result.endsAt!.toDateString()}</p>

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
                } else {
                    console.log("Email sent successfully...", info.response);
                }
            });

            sendSuccessResponse(res, 200, "Subscription extended successfully");
        } else if (result && !admin) {
            sendSuccessResponse(res, 200, "Subscription extended successfully, but Email not sent");
        } else {
            sendErrorResponse(res, 400, "Failed to Extend Subscription----");
        }
    } catch (err) {
        console.error("extendSubscription error:", err);
        sendErrorResponse(res, 500, "Server error");
    }
};

export const inactiveSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "super_admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    const { id, adminId, planId } = req.params;

    if (!id || !adminId || !planId) {
        sendErrorResponse(res, 404, "Invalid input");
        return;
    }

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id, adminId, planId },
            include: { admin: true, plan: true },
        });

        if (!subscription) {
            sendErrorResponse(res, 404, "Subscription not found");
            return;
        }

        if (!["active", "free_trial"].includes(subscription.status)) {
            sendErrorResponse(res, 400, `Only active subscriptions can be inactive`);
            return;
        }

        await prisma.$transaction(async (tx) => {
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
                    } else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
        });

        sendSuccessResponse(res, 200, "Subscription inactive successfully");
        return;
    } catch (error) {
        console.error("Error inactivating subscription:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
        return;
    }
};

// Subscription History of Admin
export const adminSubscriptionHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;

    if (!user || user.role !== "admin") {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    try {
        // Find the admin's subscription
        const subscription = await prisma.subscription.findFirst({
            where: { adminId: user.id },
            select: { id: true },
        });

        if (!subscription) {
            sendErrorResponse(res, 404, "Subscription not found");
            return;
        }

        // Fetch event history related to that subscription
        const events = await prisma.subscriptionEvent.findMany({
            where: {
                subscriptionId: subscription.id,
                eventType: {
                    in: ["subscription_created", "subscription_approved", "subscription_extended"]
                }
            },
            orderBy: { eventAt: "desc" },
            select: {
                id: true,
                // subscription: {
                //     select: {
                //         id: true,
                //         startsAt: true,
                //         endsAt: true,
                //         renewedAt: true,
                //         cancelledAt: true,
                //         plan: {
                //             select: {
                //                 id: true,
                //                 name: true,
                //                 duration: true,
                //                 price: true,
                //                 offers: true,
                //                 specs: true,
                //                 descriptions: true,
                //             }
                //         }
                //     }
                // },
                metadata: true,
            },
        });

        if (!events) {
            sendErrorResponse(res, 404, "Subscription events not found");
            return;
        }

        // Safely check if metadata contains subscription object
        const subscriptions = events
            .map(event => {
                const metadata = event.metadata;

                // Ensure metadata is an object and contains the subscription field
                if (metadata && typeof metadata === "object" && "subscription" in metadata) {
                    return metadata.subscription;
                }

                return null;
            })
            .filter(Boolean);  // Filter out null values

        if (subscriptions.length === 0) {
            sendErrorResponse(res, 404, "No valid subscription events found");
            return;
        }

        sendSuccessResponse(res, 200, "Admin subscription history fetched", {
            subscriptions,
        });

        // sendSuccessResponse(res, 200, "Admin subscription history fetched", {
        //     subscriptions: events.map(event => event.metadata?.subscription),
        // });
    } catch (error) {
        console.error("Error fetching subscription history:", error);
        sendErrorResponse(res, 500, "Internal Server Error");
    }
}