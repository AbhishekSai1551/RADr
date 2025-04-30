import React from 'react';
import { UserProfile } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

interface ProfileCardProps {
  user: UserProfile;
  onClick: (user: UserProfile) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onClick }) => {
  const { name, profession, avatar, interests, distance } = user;
  
  return (
    <div 
      className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-100"
      onClick={() => onClick(user)}
    >
      <div className="flex">
        <img 
          src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} 
          alt={name} 
          className="w-16 h-16 rounded-lg object-cover mr-4"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold">{name}</h4>
            {distance !== undefined && (
              <span className="text-xs text-gray-500">{distance.toFixed(1)} mi</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">{profession || 'No profession listed'}</p>
          <div className="flex flex-wrap gap-1">
            {interests && interests.length > 0 ? (
              interests.slice(0, 3).map((interest) => (
                <Badge key={interest.id} variant="interest" className="text-xs px-2 py-1">
                  {interest.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-400">No interests listed</span>
            )}
            {interests && interests.length > 3 && (
              <Badge variant="interest" className="text-xs px-2 py-1">+{interests.length - 3}</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
