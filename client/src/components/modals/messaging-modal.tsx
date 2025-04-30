import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Phone, Video, X, Image, Send, Circle } from 'lucide-react';
import { UserProfile, Message } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

const MessageBubble: React.FC<{ 
  message: Message; 
  isCurrentUser: boolean;
  senderAvatar?: string;
  senderName?: string;
}> = ({ 
  message, 
  isCurrentUser,
  senderAvatar,
  senderName
}) => {
  const time = message.createdAt instanceof Date 
    ? message.createdAt 
    : message.createdAt ? new Date(message.createdAt) : new Date();
  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isCurrentUser) {
    return (
      <div className="flex items-end justify-end space-x-2 mb-4">
        <span className="text-xs text-gray-500 flex-shrink-0">{formattedTime}</span>
        <div className="bg-primary text-white rounded-lg rounded-br-none p-3 shadow-sm max-w-xs">
          <p>{message.content}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-end space-x-2 mb-4">
      <img
        src={senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || '')}&background=random`}
        alt={senderName || "User"}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
      <div className="bg-white rounded-lg rounded-bl-none p-3 shadow-sm max-w-xs">
        <p className="text-gray-800">{message.content}</p>
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">{formattedTime}</span>
    </div>
  );
};

const MessagingModal: React.FC<MessagingModalProps> = ({ isOpen, onClose, user }) => {
  const [messageText, setMessageText] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', user?.id],
    queryFn: async ({ queryKey }) => {
      if (!user?.id) return [];
      
      const res = await fetch(`/api/messages/${user.id}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return res.json();
    },
    enabled: !!user?.id && isOpen,
    refetchInterval: isOpen ? 5000 : false // Poll every 5 seconds when open
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('No recipient selected');
      
      return apiRequest('POST', '/api/messages', {
        recipientId: user.id,
        content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setMessageText('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send zone message',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate(messageText);
  };
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  if (!user || !currentUser) return null;
  
  const connectionTimestamp = new Date(2023, 4, 15); // Mock data for "You connected with X on May 15"
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 h-[90vh] max-h-[600px] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
              alt={user.name}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
            <div>
              <DialogTitle className="font-semibold">{user.name}</DialogTitle>
              <p className="text-xs text-gray-500">
                {user.profession} • {user.distance?.toFixed(1)} mi away
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gray-50">
          <div className="space-y-4">
            {/* System Message */}
            <div className="flex justify-center">
              <span className="bg-gray-200 text-gray-600 rounded-full px-4 py-1 text-xs">
                You connected with {user.name} on {formatDistanceToNow(connectionTimestamp, { addSuffix: true })}
              </span>
            </div>
            
            {/* Message List */}
            {messages.map((message) => (
              <MessageBubble 
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === currentUser.id}
                senderAvatar={user.avatar || undefined}
                senderName={user.name}
              />
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex items-end justify-end space-x-2">
                <div className="bg-primary/50 text-white rounded-lg rounded-br-none p-3 shadow-sm max-w-xs animate-pulse">
                  <p>{messageText}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3">
          <div className="flex space-x-2">
            <Button type="button" variant="ghost" size="icon">
              <Image className="h-5 w-5 text-gray-500" />
            </Button>
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a zone message..."
              className="flex-1 rounded-full"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="rounded-full w-10 h-10"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;
