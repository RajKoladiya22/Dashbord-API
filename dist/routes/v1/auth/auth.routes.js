"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../../../controllers/auth/auth.controller");
const partnerAuth_controller_1 = require("../../../controllers/auth/partnerAuth.controller");
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const teamAuth_controller_1 = require("../../../controllers/auth/teamAuth.controller");
const router = (0, express_1.Router)();
router.post("/signin", auth_controller_1.signIn);
router.post("/signup", auth_controller_1.signUp);
router.post("/partner", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), partnerAuth_controller_1.createPartner);
router.post("/team", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), teamAuth_controller_1.createTeamMember);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map