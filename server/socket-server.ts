import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { log } from "./vite";
import { storage } from "./storage";
import { Message } from "@shared/schema";

// Define typed events for better type checking
interface ServerToClientEvents {
  receiveMessage: (message: Message) => void;
  messageRead: (data: { senderId: number; recipientId: number }) => void;
  userOnline: (userId: number) => void;
  userOffline: (userId: number) => void;
}

interface ClientToServerEvents {
  sendMessage: (data: { senderId: number; recipientId: number; content: string }, callback: (message: Message) => void) => void;
  markAsRead: (data: { senderId: number; recipientId: number }) => void;
  joinRoom: (userId: number) => void;
  leaveRoom: (userId: number) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId: number;
}

// Create a mapping of user IDs to socket IDs
const connectedUsers = new Map<number, string>();

export function setupSocketServer(httpServer: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware to handle authentication
  io.use((socket: Socket, next) => {
    // You could add authentication here
    // For example, validate a token from socket.handshake.auth.token
    next();
  });

  io.on("connection", (socket) => {
    log("Client connected", "socket.io");
    
    // When a user joins, map their user ID to their socket ID
    socket.on("joinRoom", (userId) => {
      log(`User ${userId} joined`, "socket.io");
      
      // Store user ID in socket data for reference
      socket.data.userId = userId;
      
      // Add user to the connected users map
      connectedUsers.set(userId, socket.id);
      
      // Broadcast to all connected clients that this user is online
      io.emit("userOnline", userId);
    });

    // Handle sending messages
    socket.on("sendMessage", async (data, callback) => {
      try {
        // Save the message to the database
        const message = await storage.createMessage({
          senderId: data.senderId,
          recipientId: data.recipientId,
          content: data.content,
        });

        // Send the message back to the sender as confirmation
        callback(message);

        // If recipient is connected, send them the message
        const recipientSocketId = connectedUsers.get(data.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receiveMessage", message);
        }
      } catch (error) {
        log(`Error sending message: ${error}`, "socket.io");
      }
    });

    // Handle marking messages as read
    socket.on("markAsRead", async (data) => {
      try {
        await storage.markMessagesAsRead(data.senderId, data.recipientId);
        
        // Notify the original sender that their messages were read
        const senderSocketId = connectedUsers.get(data.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageRead", {
            senderId: data.senderId,
            recipientId: data.recipientId,
          });
        }
      } catch (error) {
        log(`Error marking messages as read: ${error}`, "socket.io");
      }
    });

    // Handle user disconnection
    socket.on("leaveRoom", (userId) => {
      if (userId) {
        connectedUsers.delete(userId);
        io.emit("userOffline", userId);
        log(`User ${userId} left`, "socket.io");
      }
    });

    socket.on("disconnect", () => {
      // If we have a user ID in the socket data, handle their disconnection
      if (socket.data.userId) {
        connectedUsers.delete(socket.data.userId);
        io.emit("userOffline", socket.data.userId);
        log(`User ${socket.data.userId} disconnected`, "socket.io");
      }
    });
  });

  log("Socket.io server initialized", "socket.io");
  return io;
}