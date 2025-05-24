"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_config_1 = require("../../config/database.config");
const node_cron_1 = __importDefault(require("node-cron"));
node_cron_1.default.schedule("0 */12 * * *", async () => {
    console.log("--->");
    await updateStatus();
});
const updateStatus = async () => {
    try {
        const now = new Date();
        await database_config_1.prisma.subscription.updateMany({
            where: {
                endsAt: {
                    lte: now,
                },
            },
            data: {
                status: 'expired',
            },
        });
        console.log("Subscription status updated successfully.");
    }
    catch (error) {
        console.error("Error updating subscription statuse:", error);
    }
};
//# sourceMappingURL=planStatus.js.map