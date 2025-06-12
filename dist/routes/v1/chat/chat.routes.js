"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const chat_controller_1 = require("../../../controllers/chat/chat.controller");
router.get("/", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin", "partner", "team_member"), chat_controller_1.chat_user);
router.get("/:id", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin", "partner", "team_member"), chat_controller_1.chat_user);
router.post("/:id", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin", "partner", "team_member"), chat_controller_1.storedMSG);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map