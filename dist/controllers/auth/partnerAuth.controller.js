"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPartner = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const createPartner = async (req, res, next) => {
    var _a, _b;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
            (0, httpResponse_1.sendErrorResponse)(res, 403, "Only admins can create partners.");
            return;
        }
        const adminID = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const { partner_name, company_name, contact_info, email, password } = req.body;
        const [firstName, ...rest] = partner_name.trim().split(" ");
        const lastName = rest.join(" ") || "";
        const partner = await database_config_1.prisma.$transaction(async (tx) => {
            const exists = await tx.partner.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (exists)
                throw new Error("Email already in use.");
            const passwordHash = await bcrypt_1.default.hash(password, 12);
            return tx.partner.create({
                data: {
                    adminId: adminID,
                    role: "partner",
                    companyName: company_name,
                    firstName,
                    lastName,
                    contactInfo: contact_info !== null && contact_info !== void 0 ? contact_info : {},
                    address: {},
                    email: email.toLowerCase(),
                    passwordHash,
                    status: "active",
                },
                select: { id: true, email: true, firstName: true, lastName: true },
            });
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Partner created successfully.", { partner });
    }
    catch (err) {
        if (err.message === "Email already in use.") {
            (0, httpResponse_1.sendErrorResponse)(res, 409, err.message);
        }
        else {
            console.error("Error creating partner:", err);
            (0, httpResponse_1.sendErrorResponse)(res, 500, "Internal server error.");
        }
        next(err);
    }
};
exports.createPartner = createPartner;
//# sourceMappingURL=partnerAuth.controller.js.map