"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const custommField_controller_1 = require("../../../controllers/customer/custommField.controller");
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const router = (0, express_1.Router)();
router.get('/customfield', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), custommField_controller_1.listAdminCustomFields);
router.post('/customfield', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), custommField_controller_1.createAdminCustomField);
router.put('/customfield/:id', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), custommField_controller_1.updateAdminCustomField);
router.delete('/customfield/:id', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), custommField_controller_1.deleteAdminCustomField);
exports.default = router;
//# sourceMappingURL=customField.routes.js.map