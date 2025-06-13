"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storedMSG = exports.chat_user = exports.sendMessageToUser = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const socket_1 = require("../../socket.io/socket");
const sendMessageToUser = (toUserId, message) => {
    const io = (0, socket_1.getIO)();
    const onlineUsers = (0, socket_1.getOnlineUsers)();
    const socketId = onlineUsers.get(toUserId);
    console.log(`Sending message to user ${toUserId} with socketId ${socketId}`, message);
    if (socketId) {
        io.to(socketId).emit("receive_message", message);
    }
    else {
        console.log(`User ${toUserId} is not online.`);
    }
};
exports.sendMessageToUser = sendMessageToUser;
const chat_user = async (req, res, next) => {
    const chatUserId = req.params.id;
    const user = req.user;
    if (!user) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    try {
        if (!chatUserId) {
            const loginData = await database_config_1.prisma.loginCredential.findFirst({
                where: { userProfileId: user.id },
            });
            if (!loginData) {
                (0, httpResponse_1.sendErrorResponse)(res, 404, "Login Credential Not Found");
                return;
            }
            const adminId = loginData.adminId;
            if (!adminId) {
                (0, httpResponse_1.sendErrorResponse)(res, 404, "Admin Id Not Found");
                return;
            }
            const allUsers = await database_config_1.prisma.loginCredential.findMany({
                where: { adminId },
            });
            if (!allUsers.length) {
                (0, httpResponse_1.sendErrorResponse)(res, 404, "No users found under this admin");
                return;
            }
            const currentUserData = {
                id: loginData.id,
                email: loginData.email,
            };
            const otherUser = allUsers
                .filter(u => u.id !== loginData.id)
                .map(user => ({
                id: user.userProfileId,
                email: user.email,
                selectChat: `http://localhost:3000/api/v1/chat/${user.userProfileId}`,
            }));
            (0, httpResponse_1.sendSuccessResponse)(res, 200, "Chat user list fetched", {
                currentUser: currentUserData,
                otherUser,
            });
        }
        else {
            const senderLogin = await database_config_1.prisma.loginCredential.findFirst({
                where: { userProfileId: user.id },
            });
            const receiverLogin = await database_config_1.prisma.loginCredential.findFirst({
                where: { userProfileId: chatUserId },
            });
            if (!senderLogin || !receiverLogin) {
                (0, httpResponse_1.sendErrorResponse)(res, 404, "Sender or receiver not found");
                return;
            }
            const messagesData = await database_config_1.prisma.liveChatApp.findMany({
                where: {
                    OR: [
                        { senderId: senderLogin.id, receiverId: receiverLogin.id },
                        { senderId: receiverLogin.id, receiverId: senderLogin.id },
                    ],
                },
                include: {
                    sender_id: true,
                },
                orderBy: { createdAt: "asc" },
            });
            const messages = messagesData.map(m => ({
                text: m.content,
                from: m.senderId === senderLogin.id ? "me" : m.sender_id.email,
                time: new Date(m.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }),
            }));
            (0, httpResponse_1.sendSuccessResponse)(res, 200, "Messages fetched successfully", { messages });
        }
    }
    catch (err) {
        console.error("Fetching error:", err);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
};
exports.chat_user = chat_user;
const storedMSG = async (req, res) => {
    const chatUserId = req.params.id;
    const user = req.user;
    console.log("receiver id------>", chatUserId);
    if (!user) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    try {
        const msg = req.body.message;
        const senderData = await database_config_1.prisma.loginCredential.findFirst({
            where: { userProfileId: user.id },
        });
        const receiverData = await database_config_1.prisma.loginCredential.findFirst({
            where: { userProfileId: chatUserId },
        });
        if (!senderData || !receiverData) {
            (0, httpResponse_1.sendErrorResponse)(res, 404, "Sender or receiver not found");
            return;
        }
        const saved = await database_config_1.prisma.liveChatApp.create({
            data: {
                adminId: senderData.adminId,
                senderId: senderData.id,
                receiverId: receiverData.id,
                content: msg
            }
        });
        const responseMessage = {
            text: saved.content,
            time: new Date(saved.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }),
            senderId: senderData.id,
            receiverId: receiverData.id,
        };
        (0, exports.sendMessageToUser)(receiverData.id, responseMessage);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Message sent successfully...", { data: responseMessage });
    }
    catch (error) {
        console.error("Message creation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.storedMSG = storedMSG;
//# sourceMappingURL=chat.controller.js.map