"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const team_members_controller_1 = require("../../../controllers/team-members/team-members.controller");
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const router = (0, express_1.Router)();
router.get("/", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), team_members_controller_1.listTeamMembers);
router.patch("/:id/status", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), team_members_controller_1.updateTeamMemberStatus);
exports.default = router;
//# sourceMappingURL=teamMember.routes.js.map