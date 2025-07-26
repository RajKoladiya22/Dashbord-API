"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const subscription_controller_1 = require("../../../controllers/subscription/subscription.controller");
const router = (0, express_1.Router)();
router.post("/purchase", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), subscription_controller_1.purchaseSubscription);
router.get("/list", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.listAllSubscriptions);
router.patch("/approve/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.approveSubscription);
router.patch("/disapprove/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.disapproveSubscription);
router.patch("/cancel/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.cancelSubscription);
router.patch("/suspend/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.suspendSubscription);
router.patch("/resume/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.resumeSubscription);
router.delete("/delete/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.deleteSubscription);
router.patch("/unblock/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.unblockSubscription);
router.patch("/extend/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.extendSubscription);
router.patch("/inactive/:id/:adminId/:planId", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), subscription_controller_1.inactiveSubscription);
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map