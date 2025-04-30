import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { User, UserProfile } from '@shared/schema';
import SideNavigation from '@/components/side-navigation';
import MobileNavigation from '@/components/mobile-navigation';
import ProfileModal from '@/components/modals/profile-modal';
import MessagingModal from '@/components/modals/messaging-modal';
import { Search, Users, MessageSquare, UserPlus, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface Connection {
  id: number;
  status: string;
  createdAt: string;
  user: User;
}

const ConnectionsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);
  const [messagingUser, setMessagingUser] = useState<UserProfile | null>(null);
  
  // Fetch user connections
  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    queryFn: async () => {
      const res = await fetch('/api/connections', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch connections');
      }
      
      return res.json();
    }
  });
  
  // Filter connections based on search query
  const filteredConnections = connections.filter(conn => 
    conn.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.user.profession?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle user selection to view profile
  const handleUserSelect = (connection: Connection) => {
    // Transform User to UserProfile format
    const userProfile: UserProfile = {
      ...connection.user,
      interests: [], // We don't have interests in the connection data
      distance: undefined // We don't have distance in the connection data
    };
    
    setSelectedProfile(userProfile);
    setShowProfileModal(true);
  };
  
  // Handle opening messaging modal
  const handleOpenMessaging = (user: UserProfile) => {
    setMessagingUser(user);
    setShowMessagingModal(true);
    setShowProfileModal(false);
  };
  
  // Accept a connection request
  const handleAcceptConnection = async (connectionId: number) => {
    try {
      await apiRequest('PUT', `/api/connections/${connectionId}`, { status: 'accepted' });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      toast({
        title: 'Connection accepted',
        description: 'You are now connected with this user',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to accept connection',
        description: error.message || 'There was an error accepting the connection',
        variant: 'destructive',
      });
    }
  };
  
  // Reject a connection request
  const handleRejectConnection = async (connectionId: number) => {
    try {
      await apiRequest('PUT', `/api/connections/${connectionId}`, { status: 'rejected' });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      toast({
        title: 'Connection rejected',
        description: 'You have rejected this connection request',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to reject connection',
        description: error.message || 'There was an error rejecting the connection',
        variant: 'destructive',
      });
    }
  };
  
  if (!user) return null;
  
  // Separate connections into accepted and pending
  const acceptedConnections = filteredConnections.filter(conn => conn.status === 'accepted');
  const pendingConnections = filteredConnections.filter(conn => conn.status === 'pending');
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm py-3 px-4 flex justify-between items-center md:hidden">
        <div className="flex items-center">
          <span className="text-primary font-bold text-xl">RAD.r</span>
        </div>
        <div className="flex items-center space-x-4">
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
            <h2 className="text-xl font-semibold">Connections</h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search connections..."
                  className="pl-10 pr-4 py-2 w-64"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </header>
          
          {/* Connections List */}
          <div className="flex-1 bg-white">
            <Tabs defaultValue="connected" className="w-full">
              <TabsList className="mx-4 md:mx-6 mt-4 grid w-[400px] grid-cols-2">
                <TabsTrigger value="connected" className="flex gap-2">
                  <Users className="h-4 w-4" />
                  <span>Connected</span>
                  {acceptedConnections.length > 0 && (
                    <span className="bg-gray-200 text-gray-800 rounded-full px-2 py-0.5 text-xs">
                      {acceptedConnections.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Pending</span>
                  {pendingConnections.length > 0 && (
                    <span className="bg-secondary text-white rounded-full px-2 py-0.5 text-xs">
                      {pendingConnections.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="connected" className="p-0 border-none">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : acceptedConnections.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {acceptedConnections.map((conn) => (
                      <div key={conn.id} className="p-4 hover:bg-gray-50 flex items-center">
                        <div 
                          className="flex-1 flex items-center cursor-pointer"
                          onClick={() => handleUserSelect(conn)}
                        >
                          <img
                            src={conn.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conn.user.name)}&background=random`}
                            alt={conn.user.name}
                            className="w-12 h-12 rounded-full object-cover mr-4"
                          />
                          <div>
                            <h3 className="font-semibold">{conn.user.name}</h3>
                            <p className="text-sm text-gray-600">{conn.user.profession || 'No profession listed'}</p>
                            <p className="text-xs text-gray-500">
                              Connected {formatDistanceToNow(new Date(conn.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="mr-2"
                          onClick={() => {
                            // Transform User to UserProfile format
                            const userProfile: UserProfile = {
                              ...conn.user,
                              interests: [], // We don't have interests in the connection data
                              distance: undefined // We don't have distance in the connection data
                            };
                            handleOpenMessaging(userProfile);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No connections yet</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      {searchQuery 
                        ? `No connections matching "${searchQuery}"`
                        : "Start exploring nearby people to connect with them"}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pending" className="p-0 border-none">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : pendingConnections.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {pendingConnections.map((conn) => (
                      <div key={conn.id} className="p-4 hover:bg-gray-50 flex items-center">
                        <div 
                          className="flex-1 flex items-center cursor-pointer"
                          onClick={() => handleUserSelect(conn)}
                        >
                          <img
                            src={conn.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conn.user.name)}&background=random`}
                            alt={conn.user.name}
                            className="w-12 h-12 rounded-full object-cover mr-4"
                          />
                          <div>
                            <h3 className="font-semibold">{conn.user.name}</h3>
                            <p className="text-sm text-gray-600">{conn.user.profession || 'No profession listed'}</p>
                            <p className="text-xs text-gray-500">
                              Requested {formatDistanceToNow(new Date(conn.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleAcceptConnection(conn.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRejectConnection(conn.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <UserPlus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No pending requests</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      When someone wants to connect with you, you'll see their request here
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Modals */}
      <ProfileModal
        user={selectedProfile}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onMessage={handleOpenMessaging}
      />
      
      <MessagingModal
        isOpen={showMessagingModal}
        onClose={() => setShowMessagingModal(false)}
        user={messagingUser}
      />
    </div>
  );
};

export default ConnectionsPage;
