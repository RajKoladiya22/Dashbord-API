import { prisma } from "../../config/database.config";
import cron from "node-cron";


cron.schedule("0 */12 * * *", async () => {
    console.log("--->")
    await updateStatus();
});

const updateStatus = async (): Promise<void> => {
    try {
        const now = new Date();
        await prisma.subscription.updateMany({
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
    } catch (error) {
        console.error("Error updating subscription statuse:", error);
    }
};
