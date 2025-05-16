"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = exports.generateToken = exports.authorizeRoles = exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const httpResponse_1 = require("../../utils/httpResponse");
const database_config_1 = require("../../../config/database.config");
const _secret = database_config_1.env.JWT_SECRET;
const _expires = database_config_1.env.JWT_EXPIRES_IN || "30d";
const authenticateUser = (req, res, next) => {
    var _a;
    try {
        let token;
        token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.rJmkUxzNakU;
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }
        if (!token) {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Authentication token missing");
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, _secret, {
            algorithms: ["HS256"],
        });
        if (!decoded ||
            typeof decoded !== "object" ||
            !decoded.id ||
            !decoded.role) {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Invalid token payload");
            return;
        }
        req.user = {
            id: decoded.id,
            role: decoded.role,
            adminId: decoded.adminId,
        };
        next();
    }
    catch (err) {
        console.log("err.name---->", err.name);
        console.log("\n\nerr---->", err);
        if (err.name === "TokenExpiredError") {
            res.clearCookie("rJmkUxzNakU", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            });
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Token expired");
            return;
        }
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized access");
        return;
    }
};
exports.authenticateUser = authenticateUser;
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    var _a;
    const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    if (!role || !allowedRoles.includes(role)) {
        (0, httpResponse_1.sendErrorResponse)(res, 403, "Forbidden:You Don't have Permission");
    }
    next();
};
exports.authorizeRoles = authorizeRoles;
const generateToken = (userId, role, adminId) => {
    const payload = {
        id: userId,
        role,
        ...(adminId && { adminId }),
    };
    return jsonwebtoken_1.default.sign(payload, _secret, {
        expiresIn: "1d",
        algorithm: "HS256",
    });
};
exports.generateToken = generateToken;
const setAuthCookie = (res, token) => {
    res.cookie("rJmkUxzNakU", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 86400000,
    });
};
exports.setAuthCookie = setAuthCookie;
//# sourceMappingURL=jwt.token.js.map