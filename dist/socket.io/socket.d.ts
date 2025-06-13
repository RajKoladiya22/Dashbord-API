import { Server } from "socket.io";
export declare const initSocket: (server: any) => void;
export declare const getIO: () => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getOnlineUsers: () => Map<string, string>;
