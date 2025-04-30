import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { Message, User } from '@shared/schema';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/queryClient';

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

// Define the context type
type SocketContextType = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  sendMessage: (data: { recipientId: number; content: string }) => Promise<Message | null>;
  markMessagesAsRead: (senderId: number) => void;
  onlineUsers: Set<number>;
};

// Create context
const SocketContext = createContext<SocketContextType | null>(null);

// Create provider component
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
      return;
    }

    // Create socket connection if not already established
    if (!socket) {
      const socketInstance = io({
        withCredentials: true,
        autoConnect: true,
      });

      setSocket(socketInstance);

      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        // Join room with user ID
        socketInstance.emit('joinRoom', user.id);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        setOnlineUsers(new Set());
      });

      socketInstance.on('userOnline', (userId) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.add(userId);
          return updated;
        });
      });

      socketInstance.on('userOffline', (userId) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      });

      socketInstance.on('receiveMessage', (message) => {
        // Update messages in the cache
        queryClient.invalidateQueries({ queryKey: ['/api/messages', message.senderId] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });

        // Show notification if not in the current conversation
        const currentRoute = window.location.pathname;
        const isInMessagesPage = currentRoute.includes('/messages');
        
        if (!isInMessagesPage) {
          toast({
            title: 'New Message',
            description: `You have a new message from a connection`,
          });
        }
      });

      socketInstance.on('messageRead', (data) => {
        // Update messages to show read status
        if (data.recipientId === user.id) {
          queryClient.invalidateQueries({ queryKey: ['/api/messages', data.senderId] });
        }
      });

      return () => {
        if (socketInstance && user) {
          socketInstance.emit('leaveRoom', user.id);
          socketInstance.disconnect();
        }
      };
    }
  }, [user, toast]);

  // Function to send a message
  const sendMessage = async (data: { recipientId: number; content: string }): Promise<Message | null> => {
    if (!socket || !user || !isConnected) {
      toast({
        title: 'Connection Error',
        description: 'You are not connected to the messaging service',
        variant: 'destructive',
      });
      return null;
    }

    return new Promise((resolve) => {
      socket.emit(
        'sendMessage',
        {
          senderId: user.id,
          recipientId: data.recipientId,
          content: data.content,
        },
        (message) => {
          // Callback with the sent message
          queryClient.invalidateQueries({ queryKey: ['/api/messages', data.recipientId] });
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          resolve(message);
        }
      );
    });
  };

  // Function to mark messages as read
  const markMessagesAsRead = (senderId: number) => {
    if (!socket || !user || !isConnected) return;

    socket.emit('markAsRead', {
      senderId,
      recipientId: user.id,
    });

    // Update local cache
    queryClient.invalidateQueries({ queryKey: ['/api/messages', senderId] });
    queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
  };

  // Context value
  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    markMessagesAsRead,
    onlineUsers,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// Custom hook to use the socket context
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}