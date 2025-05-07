"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const partner_routes_1 = __importDefault(require("./partnerRoutes/partner.routes"));
const teamMember_routes_1 = __importDefault(require("./teamMemberRoutes/teamMember.routes"));
const product_routes_1 = __importDefault(require("./product/product.routes"));
const customer_routes_1 = __importDefault(require("./customer/customer.routes"));
const plan_routes_1 = __importDefault(require("./plan/plan.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/partner', partner_routes_1.default);
router.use('/team-members', teamMember_routes_1.default);
router.use('/product', product_routes_1.default);
router.use('/customer', customer_routes_1.default);
router.use('/plan', plan_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map