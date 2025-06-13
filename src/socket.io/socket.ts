import { Server } from "socket.io";

let io: Server;
const onlineUsers = new Map<string, string>(); // map to store online users with their socket id as key and username as value

export const initSocket = (server: any) => { // export the function to initialize socket
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173", "https://dashbord-seven-sigma.vercel.app", "https://cpm.magicallysoft.com"], // replace with your frontend URL
      credentials: true,
    },
  });

  io.on("connection", (socket) => {   
    console.log("🕵️‍♀️ User connected:", socket.id);

    socket.on("register", (userId: string) => {
      onlineUsers.set(userId, socket.id); // store user id and socket id in map
      console.log(`📌 Registered user ${userId} with socket ID ${socket.id}`); 
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) { // iterate over map entries with user id and socket id
        if (socketId === socket.id) { // check if socket id matches the one that disconnected
          onlineUsers.delete(userId);// remove user id from map
          console.log(`❌ User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};

export const getIO = () => { 
  if (!io) throw new Error("Socket.io not initialized");  // check if socket.io is initialized
  return io;// return the initialized socket.io instance
};

export const getOnlineUsers = () => onlineUsers;
