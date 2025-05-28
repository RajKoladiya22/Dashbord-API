"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subAdminDetails = exports.listAllAdmins = void 0;
const database_config_1 = require("../../config/database.config");
const listAllAdmins = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const admins = await database_config_1.prisma.admin.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
                companyName: true,
            },
        });
        if (!admins || admins.length === 0) {
            res.status(404).json({ message: "No admin found" });
            return;
        }
        const adminDetailsWithLinks = admins.map((admin) => {
            const links = [
                { label: "TeamMembers", url: `/admins/${admin.id}/teammembers` },
                { label: "Patners", url: `/admins/${admin.id}/patners` },
                { label: "Subscription", url: `/admins/${admin.id}/subscription` },
                { label: "Product", url: `/admins/${admin.id}/products` },
                { label: "Customers", url: `/admins/${admin.id}/customers` },
                { label: "CustomerProductHistory", url: `/admins/${admin.id}/customerproducthistory` },
                { label: "AdminCustomField", url: `/admins/${admin.id}/admincustomfield` },
            ];
            return {
                ...admin,
                links,
            };
        });
        res.status(200).json(adminDetailsWithLinks);
    }
    catch (err) {
        console.error("Error listing admin details:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.listAllAdmins = listAllAdmins;
const subAdminDetails = async (req, res, next) => {
    const user = req.user;
    const id = req.params.id;
    const query = req.params.query;
    if (!user || user.role !== "super_admin") {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        if (query === "teammembers") {
            const teammembers = await database_config_1.prisma.teamMember.findMany({
                where: { adminId: id },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    role: true,
                    department: true,
                    position: true,
                    contactInfo: true,
                    address: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!teammembers || teammembers.length === 0) {
                res.status(404).json({ message: "No team members found" });
                return;
            }
            const adminDetailsWithBackLink = teammembers.map((team) => ({
                ...team,
                backLink: "/api/v1/auth/details",
            }));
            res.status(200).json(adminDetailsWithBackLink);
            return;
        }
        else if (query === "patners") {
            const patners = await database_config_1.prisma.partner.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    role: true,
                    customers: true,
                    contactInfo: true,
                    address: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!patners || patners.length === 0) {
                res.status(404).json({ message: "No patners are found" });
            }
            else {
                const adminDetailsWithBackLink = patners.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
            }
        }
        else if (query === "subscription") {
            const subscription = await database_config_1.prisma.subscription.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    plan: true,
                    planId: true,
                    status: true,
                    startsAt: true,
                    endsAt: true,
                    renewedAt: true,
                    cancelledAt: true,
                    payments: true,
                    events: true,
                },
            });
            if (!subscription || subscription.length === 0) {
                res.status(404).json({ message: "No subscription are found" });
            }
            else {
                const adminDetailsWithBackLink = subscription.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
            }
        }
        else if (query === "products") {
            const products = await database_config_1.prisma.product.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    productName: true,
                    productCategory: true,
                    productPrice: true,
                    description: true,
                    productLink: true,
                    specifications: true,
                    tags: true,
                    status: true,
                    createdAt: true,
                    customerProductHistory: true,
                    renewalHistory: true,
                },
            });
            if (!products || products.length === 0) {
                res.status(404).json({ message: "No products are found" });
            }
            else {
                const adminDetailsWithBackLink = products.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
            }
        }
        else if (query === "customers") {
            const customer = await database_config_1.prisma.customer.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    companyName: true,
                    contactPerson: true,
                    mobileNumber: true,
                    email: true,
                    serialNo: true,
                    prime: true,
                    blacklisted: true,
                    adminCustomFields: true,
                    createdAt: true,
                    joiningDate: true,
                },
            });
            if (!customer || customer.length === 0) {
                res.status(404).json({ message: "No customers are found" });
            }
            else {
                const adminDetailsWithBackLink = customer.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
            }
        }
        else if (query === "customerproducthistory") {
            const customerproducthistory = await database_config_1.prisma.customerProductHistory.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    customerId: true,
                    adminId: true,
                    productId: true,
                    purchaseDate: true,
                    renewPeriod: true,
                    expiryDate: true,
                    renewalDate: true,
                    customer: true,
                    product: true,
                },
            });
            if (!customerproducthistory || customerproducthistory.length === 0) {
                res.status(404).json({ message: "No customerproducthistory are found" });
            }
            else {
                const adminDetailsWithBackLink = customerproducthistory.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
            }
        }
        else if (query === "admincustomfield") {
            const admincustomfield = await database_config_1.prisma.adminCustomField.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    fieldName: true,
                    fieldType: true,
                    isRequired: true,
                    options: true,
                    isMultiSelect: true,
                    status: true,
                    createdAt: true,
                },
            });
            if (!admincustomfield || admincustomfield.length === 0) {
                res.status(404).json({ message: "No admincustomfield are found" });
            }
            else {
                const adminDetailsWithBackLink = admincustomfield.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
            }
        }
        else {
            res.status(404).json({ message: "No Details found" });
        }
    }
    catch (err) {
        console.error("Error listing admin details:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.subAdminDetails = subAdminDetails;
//# sourceMappingURL=superAdmin.controller.js.map