"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const express_1 = require("express");
const plan_controller_1 = require("../../../controllers/plan/plan.controller");
const router = (0, express_1.Router)();
router.post("/", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), plan_controller_1.createPlan);
router.get("/", plan_controller_1.listPlans);
router.patch("/status/:id", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), plan_controller_1.setPlanStatus);
router.put("/:id", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), plan_controller_1.updatePlan);
router.delete("/:id", jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("super_admin"), plan_controller_1.deletePlan);
exports.default = router;
//# sourceMappingURL=plan.routes.js.map