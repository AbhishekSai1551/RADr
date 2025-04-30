import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Interest, UserProfile } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Save, Plus, Camera, ImagePlus } from 'lucide-react';
import SideNavigation from '@/components/side-navigation';
import MobileNavigation from '@/components/mobile-navigation';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  
  // Fetch user profile data
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      return res.json();
    }
  });
  
  // Set profile data when it's loaded
  React.useEffect(() => {
    if (profile) {
      setProfileData(profile);
    }
  }, [profile]);
  
  // Fetch all available interests
  const { data: allInterests = [] } = useQuery<Interest[]>({
    queryKey: ['/api/interests'],
    queryFn: async () => {
      const res = await fetch('/api/interests');
      
      if (!res.ok) {
        throw new Error('Failed to fetch interests');
      }
      
      return res.json();
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return apiRequest('PUT', '/api/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update profile',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditing) {
      // If already editing, cancel and reset
      setProfileData(profile || {});
    }
    setIsEditing(!isEditing);
  };
  
  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm py-3 px-4 flex justify-between items-center md:hidden">
        <div className="flex items-center">
          <span className="text-primary font-bold text-xl">Proxima</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant={isEditing ? "outline" : "default"}
            size="sm"
            onClick={handleEditToggle}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <SideNavigation user={user} />
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm mb-6 relative">
              {/* Cover Image */}
              <div className="h-48 rounded-t-lg bg-gray-200 relative">
                {profileData.coverImage ? (
                  <img 
                    src={profileData.coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImagePlus className="h-12 w-12" />
                  </div>
                )}
                
                {isEditing && (
                  <button className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full">
                    <Camera className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {/* Profile Picture and Actions */}
              <div className="px-6 pb-6 pt-20 relative">
                <div className="absolute -top-16 left-6">
                  <div className="w-32 h-32 rounded-full bg-white p-1 shadow-md">
                    <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden relative">
                      {profileData.avatar ? (
                        <img 
                          src={profileData.avatar} 
                          alt={profileData.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=random&size=150`}
                          alt={profileData.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {isEditing && (
                        <button className="absolute bottom-1 right-1 bg-black/50 text-white p-1.5 rounded-full">
                          <Camera className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Profile Actions */}
                <div className="flex justify-end">
                  <div className="space-x-2">
                    <Button 
                      variant={isEditing ? "outline" : "default"}
                      onClick={handleEditToggle}
                      className="hidden md:inline-flex"
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                    
                    {isEditing && (
                      <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Profile Basic Info */}
                {isEditing ? (
                  <form className="mt-4 space-y-4" onSubmit={handleSaveProfile}>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name || ''}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        name="profession"
                        value={profileData.profession || ''}
                        onChange={handleInputChange}
                        placeholder="Your profession"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={profileData.gender || 'prefer_not_to_say'}
                        onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non_binary">Non-binary</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio || ''}
                        onChange={handleInputChange}
                        placeholder="Tell others about yourself"
                        rows={4}
                      />
                    </div>
                    
                    {/* Education and Professional Experience fields removed */}
                    
                    <div>
                      <Label htmlFor="hobbies">Hobbies</Label>
                      <Textarea
                        id="hobbies"
                        name="hobbies"
                        value={profileData.hobbies || ''}
                        onChange={handleInputChange}
                        placeholder="What do you enjoy doing in your free time?"
                        rows={3}
                      />
                    </div>
                  </form>
                ) : (
                  <div className="mt-4">
                    <h1 className="text-2xl font-bold">{profileData.name}</h1>
                    <div className="flex flex-col gap-1">
                      <p className="text-gray-600">{profileData.profession || 'No profession listed'}</p>
                      <p className="text-gray-600 text-sm">
                        Gender: {profileData.gender === 'male' ? 'Male' : 
                          profileData.gender === 'female' ? 'Female' : 
                          profileData.gender === 'non_binary' ? 'Non-binary' : 
                          'Prefer not to say'}
                      </p>
                    </div>
                    
                    {profileData.bio && (
                      <div className="mt-4">
                        <h3 className="font-semibold text-lg mb-2">About</h3>
                        <p className="text-gray-700">{profileData.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Interests Section */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Interests</CardTitle>
                  {isEditing && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Interest
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile && 'interests' in profile && profile.interests && profile.interests.length > 0 ? (
                    (profile.interests as Interest[]).map((interest: Interest) => (
                      <Badge key={interest.id} variant="interest" className="px-3 py-1.5 rounded-full text-sm">
                        {interest.name}
                        {isEditing && (
                          <button className="ml-1 text-gray-500 hover:text-gray-700">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No interests added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Additional Sections: Education, Experience, etc. */}
            {!isEditing && (
              <>
                {/* Education and Professional Experience sections removed */}
                
                {profileData.hobbies && (
                  <Card className="mb-6">
                    <CardHeader className="pb-3">
                      <CardTitle>Hobbies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{profileData.hobbies}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
};

export default ProfilePage;
