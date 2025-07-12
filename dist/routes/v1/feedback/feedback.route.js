"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const express_1 = require("express");
const feedback_controller_1 = require("../../../controllers/feedback/feedback.controller");
const router = (0, express_1.Router)();
router.post("/", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin", "partner", "team_member", "sub_admin"), feedback_controller_1.addFeedback);
router.get("/", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), feedback_controller_1.listFeedbacks);
exports.default = router;
//# sourceMappingURL=feedback.route.js.map