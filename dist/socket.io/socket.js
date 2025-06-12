"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUsers = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const onlineUsers = new Map();
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "http://localhost:3000",
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log("🕵️‍♀️ User connected:", socket.id);
        socket.on("register", (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`📌 Registered user ${userId} with socket ID ${socket.id}`);
        });
        socket.on("disconnect", () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`❌ User ${userId} disconnected`);
                    break;
                }
            }
        });
    });
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket.io not initialized");
    return io;
};
exports.getIO = getIO;
const getOnlineUsers = () => onlineUsers;
exports.getOnlineUsers = getOnlineUsers;
//# sourceMappingURL=socket.js.map