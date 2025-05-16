"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../../../controllers/product/product.controller");
const jwt_token_1 = require("../../../core/middleware/jwt/jwt.token");
const router = (0, express_1.Router)();
router.get('/', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), product_controller_1.listProducts);
router.post('/', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), product_controller_1.createProduct);
router.put('/:id', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), product_controller_1.updateProduct);
router.delete('/:id', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), product_controller_1.deleteProduct);
router.patch('/status/:id', jwt_token_1.authenticateUser, (0, jwt_token_1.authorizeRoles)("admin"), product_controller_1.changeProductStatus);
exports.default = router;
//# sourceMappingURL=product.routes.js.map