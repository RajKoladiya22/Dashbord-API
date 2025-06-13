import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import { Prisma, Role } from "@prisma/client";
import {
    sendSuccessResponse,
    sendErrorResponse,
} from "../../core/utils/httpResponse";
import { getIO, getOnlineUsers } from '../../socket.io/socket';

// send a message to specific user with receiver id and message 
export const sendMessageToUser = (toUserId: string, message: any) => {

    const io = getIO(); // get the io instance from the socket.io module which is connected to the server(attech with socket.io)
    const onlineUsers = getOnlineUsers();// get the online users from the socket.io module

    const socketId = onlineUsers.get(toUserId); // get the socket id of the user from the online users object
    console.log(`Sending message to user ${toUserId} with socketId ${socketId}`, message);

    if (socketId) {// if the user is online
        io.to(socketId).emit("receive_message", message);// emit the message to the user with the socket id
    } else { // if the user is offline
        console.log(`User ${toUserId} is not online.`); 
    }
};

export const chat_user = async (
    req: Request<{ id: string }, {}, {}>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const chatUserId = req.params.id;
    const user = req.user;
    if (!user) {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }
    // if (!chatUserId) {
    //     sendErrorResponse(res, 400, "Chat user id is required");
    // }
    try {
        if (!chatUserId) {
            const loginData = await prisma.loginCredential.findFirst({
                where: { userProfileId: user.id },
            });

            if (!loginData) {
                sendErrorResponse(res, 404, "Login Credential Not Found");
                return;
            }

            const adminId = loginData.adminId;
            if (!adminId) {
                sendErrorResponse(res, 404, "Admin Id Not Found");
                return;
            }

            const allUsers = await prisma.loginCredential.findMany({
                where: { adminId },
            });

            if (!allUsers.length) {
                sendErrorResponse(res, 404, "No users found under this admin");
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

            sendSuccessResponse(res, 200, "Chat user list fetched", {
                currentUser: currentUserData,
                otherUser,
            });
        } else {

            const senderLogin = await prisma.loginCredential.findFirst({
                where: { userProfileId: user.id },
            });
            const receiverLogin = await prisma.loginCredential.findFirst({
                where: { userProfileId: chatUserId },
            });

            if (!senderLogin || !receiverLogin) {
                sendErrorResponse(res, 404, "Sender or receiver not found");
                return;
            }

            const messagesData = await prisma.liveChatApp.findMany({
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

            sendSuccessResponse(res, 200, "Messages fetched successfully", { messages });
        }
    }
    catch (err) {
        console.error("Fetching error:", err);
        res.status(500).json({ message: "Internal server error" });
        return
    }

};

export const storedMSG = async (req: Request, res: Response): Promise<void> => {
    const chatUserId: string = req.params.id;
    const user = req.user;

    console.log("receiver id------>", chatUserId);

    // console.log("user_id","")
    if (!user) {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    try {
        const msg = req.body.message;

        const senderData = await prisma.loginCredential.findFirst({
            where: { userProfileId: user.id },
        });
        // console.log("sender data-------->", senderData);

        const receiverData = await prisma.loginCredential.findFirst({
            where: { userProfileId: chatUserId },
        });
        // console.log("receiverData data-------->", receiverData);


        if (!senderData || !receiverData) {
            sendErrorResponse(res,404,"Sender or receiver not found")
            return;
        }

        const saved = await prisma.liveChatApp.create({
            data: {
                adminId: senderData.adminId!,
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

    
        // send message to sendMessgeToUser function for with senderId and receiverId
        sendMessageToUser(receiverData.id, responseMessage);

        sendSuccessResponse(res,200,"Message sent successfully...",{data:responseMessage})

    } catch (error) {
        console.error("Message creation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
