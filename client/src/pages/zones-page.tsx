import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { User, UserProfile, Zone } from '@shared/schema';
import SideNavigation from '@/components/side-navigation';
import MobileNavigation from '@/components/mobile-navigation';
import MessagingModal from '@/components/modals/messaging-modal';
import CreateZoneModal from '@/components/modals/create-zone-modal';
import { Search, Plus, UsersRound, Clock, MapPin, Calendar, Trash2, UserPlus, Users, CalendarIcon, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, formatDistanceToNow, parseISO, isEqual, startOfDay } from 'date-fns';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ZoneParticipant {
  id: number;
  name: string;
  avatar: string | null;
  profession: string | null;
}

interface ZoneWithCreator extends Zone {
  creator: ZoneParticipant | null;
  participantUsers?: ZoneParticipant[];
}

const ZonesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Visakhapatnam');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedZoneForParticipants, setSelectedZoneForParticipants] = useState<ZoneWithCreator | null>(null);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState<boolean>(false);
  const [showCreateZoneModal, setShowCreateZoneModal] = useState<boolean>(false);
  
  // Fetch zones for the selected city
  const { data: zones = [], isLoading, refetch } = useQuery<ZoneWithCreator[]>({
    queryKey: ['/api/zones', selectedCity],
    queryFn: async () => {
      const res = await fetch(`/api/zones?city=${encodeURIComponent(selectedCity)}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch zones');
      }
      
      return res.json();
    }
  });
  
  // Cities available for filtering
  const cities = [
    'Visakhapatnam', 
    'Hyderabad', 
    'Mumbai', 
    'Delhi', 
    'Bangalore', 
    'Chennai', 
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Jaipur'
  ];
  
  // Delete zone mutation
  const deleteZoneMutation = useMutation({
    mutationFn: async (zoneId: number) => {
      const res = await fetch(`/api/zones/${zoneId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete zone');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Zone deleted',
        description: 'The zone has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zones', selectedCity] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete zone',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Join zone mutation
  const joinZoneMutation = useMutation({
    mutationFn: async (zoneId: number) => {
      const res = await fetch(`/api/zones/${zoneId}/join`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to join zone');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Zone joined',
        description: 'You have successfully joined this zone.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zones', selectedCity] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to join zone',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Leave zone mutation
  const leaveZoneMutation = useMutation({
    mutationFn: async (zoneId: number) => {
      const res = await fetch(`/api/zones/${zoneId}/leave`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to leave zone');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Left zone',
        description: 'You have left this zone.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zones', selectedCity] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to leave zone',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Helper function to check if two dates are on the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };
  
  // Filter zones based on search query and selected date
  const filteredZones = zones.filter(zone => {
    // Filter by search query
    const matchesSearch = 
      zone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.creator?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.creator?.profession?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by date if a date is selected
    if (selectedDate && zone.date) {
      const zoneDate = zone.date instanceof Date 
        ? zone.date 
        : parseISO(typeof zone.date === 'string' ? zone.date : new Date(zone.date).toISOString());
        
      return matchesSearch && isSameDay(zoneDate, selectedDate);
    }
    
    return matchesSearch;
  });
  
  if (!user) return null;
  
  // Check if current user has joined a zone
  const hasJoinedZone = (zone: ZoneWithCreator): boolean => {
    if (!zone.participants) return false;
    return zone.participants.includes(user.id.toString());
  };
  
  // Handle joining a zone
  const handleJoinZone = (zoneId: number) => {
    joinZoneMutation.mutate(zoneId);
  };
  
  // Handle leaving a zone
  const handleLeaveZone = (zoneId: number) => {
    leaveZoneMutation.mutate(zoneId);
  };
  
  // Handle contacting the zone creator
  const handleContactCreator = (zone: ZoneWithCreator) => {
    if (!zone.creator) return;
    
    // Transform User to UserProfile format
    const userProfile: UserProfile = {
      ...zone.creator,
      interests: [],
      bio: null,
      education: null,
      experience: null,
      hobbies: null,
      coverImage: null,
      email: '', // These fields are required but not needed for the modal
      username: '',
      password: '',
      gender: 'prefer_not_to_say', // Default gender
      lastActive: null,
      createdAt: null,
      latitude: null,
      longitude: null,
    };
    
    setSelectedUser(userProfile);
    setShowMessagingModal(true);
  };
  
  // Handle deleting a zone
  const handleDeleteZone = (zoneId: number) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      deleteZoneMutation.mutate(zoneId);
    }
  };
  
  // Remove participant mutation
  const removeParticipantMutation = useMutation({
    mutationFn: async ({ zoneId, participantId }: { zoneId: number, participantId: number }) => {
      const res = await fetch(`/api/zones/${zoneId}/remove-participant/${participantId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove participant');
      }
      
      return res.json();
    },
    onSuccess: (updatedZone) => {
      toast({
        title: 'Participant removed',
        description: 'Participant has been removed from the zone.',
      });
      
      // Update the current selected zone for participants if it's open
      if (selectedZoneForParticipants && selectedZoneForParticipants.id === updatedZone.id) {
        setSelectedZoneForParticipants(updatedZone);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/zones', selectedCity] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove participant',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Handle removing a participant
  const handleRemoveParticipant = (zoneId: number, participantId: number) => {
    if (window.confirm('Are you sure you want to remove this participant from the zone?')) {
      removeParticipantMutation.mutate({ zoneId, participantId });
    }
  };
  
  // After successfully creating a zone
  const handleCreateZoneSuccess = () => {
    refetch(); // Refresh the zones list
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm py-3 px-4 flex justify-between items-center md:hidden">
        <div className="flex items-center">
          <span className="text-primary font-bold text-xl">RAD.r</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowCreateZoneModal(true)}
          >
            <Plus className="h-5 w-5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <SideNavigation user={user} />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Desktop Header */}
          <header className="hidden md:flex bg-white shadow-sm py-3 px-6 items-center justify-between">
            <h2 className="text-xl font-semibold">Zones</h2>
            <div className="flex items-center space-x-6">
              <Select
                value={selectedCity}
                onValueChange={setSelectedCity}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
                    
                    {selectedDate && (
                      <XCircle
                        className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search zones..."
                  className="pl-10 pr-4 py-2 w-64"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Button 
                onClick={() => setShowCreateZoneModal(true)} 
                className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                <span>Create Zone</span>
              </Button>
            </div>
          </header>
          
          {/* Floating Action Button for Create Zone (visible on all screens) */}
          <div className="fixed bottom-20 right-6 md:right-10 z-10">
            <Button 
              onClick={() => setShowCreateZoneModal(true)} 
              className="h-14 w-14 rounded-full shadow-lg bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Zones List */}
          <div className="flex-1 flex flex-col p-4 md:p-6">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredZones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredZones.map((zone) => (
                  <Card key={zone.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{zone.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            <span>{zone.location}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {zone.city}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {zone.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center text-xs bg-gray-100 rounded-full px-3 py-1">
                          <Calendar className="h-3 w-3 mr-1.5 text-gray-500" />
                          <span>{
                            zone.date instanceof Date 
                              ? format(zone.date, 'MMM d, yyyy') 
                              : format(typeof zone.date === 'string' ? parseISO(zone.date) : new Date(zone.date), 'MMM d, yyyy')
                          }</span>
                        </div>
                        <div className="flex items-center text-xs bg-gray-100 rounded-full px-3 py-1">
                          <Clock className="h-3 w-3 mr-1.5 text-gray-500" />
                          <span>{zone.time}</span>
                        </div>
                        <div className="flex items-center text-xs bg-gray-100 rounded-full px-3 py-1">
                          <Users className="h-3 w-3 mr-1.5 text-gray-500" />
                          <span>{zone.participants?.length || 0} participants</span>
                        </div>
                      </div>
                      
                      {/* Participants button - only shows count and reveals details on click */}
                      {zone.participantUsers && zone.participantUsers.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedZoneForParticipants(zone);
                            setShowParticipantsModal(true);
                          }}
                          className="mb-4 flex items-center space-x-2 text-xs text-primary hover:text-primary/80 focus:outline-none"
                        >
                          <Users className="h-4 w-4" />
                          <span>View {zone.participantUsers.length} participant{zone.participantUsers.length !== 1 ? 's' : ''}</span>
                        </button>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center">
                          <img
                            src={zone.creator?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(zone.creator?.name || 'User')}&background=random`}
                            alt={zone.creator?.name || 'User'}
                            className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium">{zone.creator?.name || 'Unknown User'}</p>
                            <p className="text-xs text-gray-500">{zone.creator?.profession || 'No profession'}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {zone.createdBy === user.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteZone(zone.id)}
                              className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {hasJoinedZone(zone) ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleLeaveZone(zone.id)}
                              className="h-8 text-gray-700"
                            >
                              Leave
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleJoinZone(zone.id)}
                              className="h-8 text-primary"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          )}
                          
                          {zone.createdBy !== user.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleContactCreator(zone)}
                              className="h-8"
                            >
                              Contact
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UsersRound className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No zones available</h3>
                <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                  {searchQuery 
                    ? `No zones matching "${searchQuery}" in ${selectedCity}`
                    : `There are no zones in ${selectedCity} yet. Be the first to create one!`}
                </p>
                <Button 
                  onClick={() => setShowCreateZoneModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Zone</span>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Messaging Modal */}
      <MessagingModal
        isOpen={showMessagingModal}
        onClose={() => setShowMessagingModal(false)}
        user={selectedUser}
      />
      
      {/* Create Zone Modal */}
      <CreateZoneModal
        isOpen={showCreateZoneModal}
        onClose={() => {
          setShowCreateZoneModal(false);
          handleCreateZoneSuccess();
        }}
      />

      {/* Participants Modal */}
      <Dialog open={showParticipantsModal} onOpenChange={setShowParticipantsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedZoneForParticipants?.title} - Participants</DialogTitle>
            <DialogDescription>
              The following people have joined this zone
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
            {selectedZoneForParticipants?.participantUsers?.map((participant) => (
              <div key={participant.id} className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage 
                      src={participant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=random`}
                      alt={participant.name} 
                    />
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  {/* Remove button - only visible to zone creator */}
                  {selectedZoneForParticipants.createdBy === user.id && participant.id !== user.id && (
                    <button
                      onClick={() => handleRemoveParticipant(selectedZoneForParticipants.id, participant.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none"
                      title="Remove participant"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
                <span className="font-medium text-sm">{participant.name}</span>
                {participant.profession && (
                  <span className="text-xs text-gray-500">{participant.profession}</span>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setShowParticipantsModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZonesPage;
