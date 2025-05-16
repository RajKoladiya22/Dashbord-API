"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPartner = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const SALT_ROUNDS = parseInt((_a = database_config_1.env.SALT_ROUNDS) !== null && _a !== void 0 ? _a : "12", 10);
const createPartner = async (req, res, next) => {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
            (0, httpResponse_1.sendErrorResponse)(res, 403, "Only admins can create partners.");
            return;
        }
        const adminID = req.user.id;
        const { firstName, companyName, contact_info, email, password } = req.body;
        const [first_Name, ...rest] = firstName.trim().split(" ");
        const lastName = rest.join(" ") || "";
        const partnerWithCreds = await database_config_1.prisma.$transaction(async (tx) => {
            const exists = await tx.partner.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (exists)
                throw new Error("Email already in use.");
            const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            const p = await tx.partner.create({
                data: {
                    adminId: adminID,
                    role: "partner",
                    companyName,
                    firstName: first_Name,
                    lastName,
                    contactInfo: contact_info !== null && contact_info !== void 0 ? contact_info : {},
                    address: {},
                    email: email.toLowerCase(),
                    passwordHash,
                },
                select: { id: true, email: true, firstName: true, lastName: true },
            });
            await tx.loginCredential.create({
                data: {
                    role: "partner",
                    email: p.email,
                    passwordHash,
                    userProfileId: p.id,
                    adminId: adminID,
                },
            });
            return p;
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Partner created successfully.", { partner: partnerWithCreds });
    }
    catch (err) {
        if (err.message === "Email already in use.") {
            (0, httpResponse_1.sendErrorResponse)(res, 409, err.message);
        }
        else {
            console.error("Error creating partner:", err);
            (0, httpResponse_1.sendErrorResponse)(res, 500, "Internal server error.");
        }
    }
};
exports.createPartner = createPartner;
//# sourceMappingURL=partnerAuth.controller.js.map