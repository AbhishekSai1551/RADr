import React from 'react';
import { UserProfile } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, UserPlus, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProfileModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onMessage: (user: UserProfile) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  user, 
  isOpen, 
  onClose,
  onMessage
}) => {
  const { toast } = useToast();
  
  const connectWithUser = async () => {
    if (!user) return;
    
    try {
      await apiRequest("POST", "/api/connections", { recipientId: user.id });
      toast({
        title: "Connection request sent",
        description: `You've sent a connection request to ${user.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to connect",
        description: error.message || "There was an error sending your connection request",
        variant: "destructive",
      });
    }
  };
  
  const handleMessage = () => {
    if (user) {
      onMessage(user);
    }
  };
  
  if (!user) return null;
  
  const {
    name,
    profession,
    bio,
    avatar,
    coverImage,
    education,
    experience,
    interests,
    distance
  } = user;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 h-[90vh] max-h-[800px] flex flex-col overflow-hidden">
        <div className="relative">
          <img 
            src={coverImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&q=80"} 
            alt={`${name}'s cover`}
            className="w-full h-40 object-cover"
          />
          <button 
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md"
            onClick={onClose}
          >
            <X className="text-gray-500 h-4 w-4" />
          </button>
          <div className="absolute -bottom-16 left-6">
            <img 
              src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=150`} 
              alt={name}
              className="w-32 h-32 rounded-lg border-4 border-white object-cover"
            />
          </div>
        </div>
        
        <div className="pt-20 px-6 pb-0 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <DialogTitle className="text-2xl font-bold">{name}</DialogTitle>
              <p className="text-gray-600">{profession || 'No profession listed'}</p>
            </div>
            {distance !== undefined && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                {distance.toFixed(1)} mi away
              </span>
            )}
          </div>
          
          {bio && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-gray-700">{bio}</p>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interests && interests.length > 0 ? (
                interests.map(interest => (
                  <Badge key={interest.id} variant="interest" className="px-3 py-1.5 rounded-full text-sm">
                    {interest.name}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No interests listed</p>
              )}
            </div>
          </div>
          
          {education && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Education</h3>
              <div className="text-gray-700">
                <p className="text-sm">{education}</p>
              </div>
            </div>
          )}
          
          {experience && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Professional Experience</h3>
              <div className="text-gray-700">
                <p className="text-sm">{experience}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 px-6 py-4 flex space-x-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={connectWithUser}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Connect
          </Button>
          <Button 
            className="flex-1"
            onClick={handleMessage}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
