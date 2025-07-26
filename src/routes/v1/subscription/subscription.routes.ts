import { Router } from "express";
import {
    authenticateUser,
    authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";
import {
    purchaseSubscription,
    listAllSubscriptions,
    approveSubscription,
    disapproveSubscription,
    cancelSubscription,
    suspendSubscription,
    resumeSubscription,
    deleteSubscription,
    unblockSubscription,
    extendSubscription,
    inactiveSubscription,
} from "../../../controllers/subscription/subscription.controller";

const router = Router();

// Purchase and listing
router.post(
    "/purchase",
    authenticateUser,
    authorizeRoles("admin"),
    purchaseSubscription
);

router.get(
    "/list",
    authenticateUser,
    authorizeRoles("super_admin"),
    listAllSubscriptions
);

// Purchase and listing
router.patch(
    "/approve/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    approveSubscription
);

router.patch(
    "/disapprove/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    disapproveSubscription
);

router.patch(
    "/cancel/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    cancelSubscription
);

router.patch(
    "/suspend/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    suspendSubscription
);

router.patch(
    "/resume/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    resumeSubscription
);

router.delete(
    "/delete/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    deleteSubscription
);

router.patch(
    "/unblock/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    unblockSubscription
);

router.patch(
    "/extend/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    extendSubscription
);

router.patch(
    "/inactive/:id/:adminId/:planId",
    authenticateUser,
    authorizeRoles("super_admin"),
    inactiveSubscription
);

export default router;