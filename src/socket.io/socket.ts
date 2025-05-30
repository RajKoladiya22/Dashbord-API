import { Server } from "socket.io";

let io: Server;
const onlineUsers = new Map<string, string>();

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🕵️‍♀️ User connected:", socket.id);

    socket.on("register", (userId: string) => {
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

export const getIO = () => { 
  if (!io) throw new Error("Socket.io not initialized"); 
  return io;
};

export const getOnlineUsers = () => onlineUsers;
