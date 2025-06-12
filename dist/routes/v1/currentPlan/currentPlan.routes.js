"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const currentPlan_controller_1 = require("../../../controllers/plan/currentPlan.controller");
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const router = (0, express_1.Router)();
router.get("/", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), currentPlan_controller_1.currentPlan);
exports.default = router;
//# sourceMappingURL=currentPlan.routes.js.map