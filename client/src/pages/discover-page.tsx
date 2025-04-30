import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserProfile, Interest } from '@shared/schema';
import { Bell, MapPin, List, Zap, MessageSquare } from 'lucide-react';
import SideNavigation from '@/components/side-navigation';
import MobileNavigation from '@/components/mobile-navigation';
import ProfileCard from '@/components/profile-card';
import Map from '@/components/ui/map';
import Radar from '@/components/ui/radar';
import ProfileModal from '@/components/modals/profile-modal';
import MessagingModal from '@/components/modals/messaging-modal';
import ManualLocationSetter from '@/components/ui/manual-location-setter';
import { useGeolocation } from '@/lib/use-geolocation';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

const DiscoverPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'radar' | 'map' | 'list'>('radar');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);
  const [messagingUser, setMessagingUser] = useState<UserProfile | null>(null);
  
  // Fixed maximum distance at 500 meters (converted to miles for API compatibility)
  const maxDistance = 0.31; // 500 meters ≈ 0.31 miles
  
  const location = useGeolocation();
  
  // Fetch nearby users
  const { data: nearbyUsers = [] } = useQuery<UserProfile[]>({
    queryKey: ['/api/nearby'],
    queryFn: async () => {
      const res = await fetch(`/api/nearby?distance=${maxDistance}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch nearby users');
      }
      
      return res.json();
    },
    enabled: location.permissionGranted && !!location.latitude && !!location.longitude,
  });
  
  // Fetch all interests
  const { data: interests = [] } = useQuery<Interest[]>({
    queryKey: ['/api/interests'],
    queryFn: async () => {
      const res = await fetch('/api/interests');
      
      if (!res.ok) {
        throw new Error('Failed to fetch interests');
      }
      
      return res.json();
    }
  });
  
  const handleUserClick = (user: UserProfile) => {
    setSelectedProfile(user);
    setShowProfileModal(true);
  };
  
  const handleOpenMessaging = (user: UserProfile) => {
    setMessagingUser(user);
    setShowMessagingModal(true);
    setShowProfileModal(false);
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm py-3 px-4 flex justify-between items-center md:hidden">
        <div className="flex items-center">
          <span className="text-primary font-bold text-xl">RAD.r</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowMessagingModal(true)}
            className="text-gray-500"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button className="text-gray-500 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-secondary text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">3</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <SideNavigation user={user} />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Desktop Header */}
          <header className="hidden md:flex bg-white shadow-sm py-3 px-6 items-center justify-between">
            <h2 className="text-xl font-semibold">Discover Nearby</h2>
            <div className="flex items-center space-x-6">
              <Link href="/zones">
                <Button variant="outline" className="mr-2">
                  Explore Zones
                </Button>
              </Link>

              <button 
                className="text-gray-700 hover:text-primary p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowMessagingModal(true)}
              >
                <MessageSquare className="h-5 w-5" />
              </button>

              <button className="text-gray-700 hover:text-primary relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-secondary text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">3</span>
              </button>
            </div>
          </header>

          {/* View Toggle */}
          <div className="hidden md:flex px-6 py-3 bg-white border-b border-gray-200">
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'radar' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-primary'
                }`}
                onClick={() => setViewMode('radar')}
              >
                <Zap className="w-4 h-4 mr-2" />
                Radar View
              </Button>
              <Button
                variant="ghost"
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'map' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-primary'
                }`}
                onClick={() => setViewMode('map')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Map View
              </Button>
              <Button
                variant="ghost"
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-primary'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-2" />
                List View
              </Button>
            </div>
          </div>
          
          {/* Main Views Container - Desktop */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            {/* Radar View */}
            <div className={`flex-1 relative overflow-hidden ${viewMode === 'radar' ? 'block' : 'hidden'}`}>
              <div className="absolute inset-0 bg-gray-50 h-full">
                <Radar
                  currentLocation={{
                    latitude: location.latitude,
                    longitude: location.longitude
                  }}
                  nearbyUsers={nearbyUsers}
                  maxDistance={maxDistance}
                  onUserSelect={handleUserClick}
                  onMessageRequest={handleOpenMessaging}
                />
                
                {/* Location Permission Notice */}
                {!location.permissionGranted && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md text-center">
                      <Zap className="h-12 w-12 text-primary mb-4 mx-auto" />
                      <h3 className="text-xl font-bold mb-2">Enable Location Services</h3>
                      <p className="text-gray-600 mb-4">
                        RAD.r needs access to your location to help you discover people nearby.
                      </p>
                      <Button className="mb-2">
                        Enable Location
                      </Button>
                      <div className="mt-2">
                        <ManualLocationSetter />
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        We value your privacy. Your location data is only used to show you relevant connections and is never shared without your permission.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Map View */}
            <div className={`flex-1 relative overflow-hidden ${viewMode === 'map' ? 'block' : 'hidden'}`}>
              {/* Map */}
              <div className="absolute inset-0 bg-gray-200 h-full">
                <Map
                  currentLocation={{
                    latitude: location.latitude,
                    longitude: location.longitude
                  }}
                  nearbyUsers={nearbyUsers}
                  maxDistance={maxDistance}
                  onUserClick={handleUserClick}
                  showPlaces={true}
                />
                
                {/* Location Permission Notice */}
                {!location.permissionGranted && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md text-center">
                      <MapPin className="h-12 w-12 text-primary mb-4 mx-auto" />
                      <h3 className="text-xl font-bold mb-2">Enable Location Services</h3>
                      <p className="text-gray-600 mb-4">
                        RAD.r needs access to your location to help you discover people nearby.
                      </p>
                      <Button className="mb-2">
                        Enable Location
                      </Button>
                      <div className="mt-2">
                        <ManualLocationSetter />
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        We value your privacy. Your location data is only used to show you relevant connections and is never shared without your permission.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* List View - Desktop */}
            <div className={`flex-1 bg-white overflow-y-auto ${viewMode === 'list' ? 'block' : 'hidden'}`}>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">People nearby</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {nearbyUsers.length > 0 ? (
                    nearbyUsers.map(user => (
                      <div key={user.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                            alt={user.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="text-lg font-medium">{user.name}</h4>
                            <p className="text-gray-600">{user.profession || 'No profession listed'}</p>
                            {user.bio && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{user.bio}</p>}
                            
                            <div className="flex space-x-2 mt-3">
                              <Button size="sm" onClick={() => handleUserClick(user)}>View Profile</Button>
                              <Button size="sm" variant="outline" onClick={() => handleOpenMessaging(user)}>Message</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No people found</h3>
                      <p className="text-gray-500">
                        No one is within 500 meters of your location right now
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Removed the People Nearby Panel as requested */}
          </div>
          
          {/* Mobile View Container */}
          <div className="md:hidden flex-1 relative overflow-hidden">
            {/* Mobile Radar View */}
            {viewMode === 'radar' && (
              <div className="absolute inset-0 bg-gray-50 h-[calc(100vh-8rem)]">
                <Radar
                  currentLocation={{
                    latitude: location.latitude,
                    longitude: location.longitude
                  }}
                  nearbyUsers={nearbyUsers}
                  maxDistance={maxDistance}
                  onUserSelect={handleUserClick}
                  onMessageRequest={handleOpenMessaging}
                />
                
                {/* Location Permission Notice */}
                {!location.permissionGranted && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md text-center">
                      <Zap className="h-12 w-12 text-primary mb-4 mx-auto" />
                      <h3 className="text-xl font-bold mb-2">Enable Location Services</h3>
                      <p className="text-gray-600 mb-4">
                        RAD.r needs access to your location to help you discover people nearby.
                      </p>
                      <Button className="mb-2">
                        Enable Location
                      </Button>
                      <div className="mt-2">
                        <ManualLocationSetter />
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        We value your privacy. Your location data is only used to show you relevant connections and is never shared without your permission.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Mobile Map View */}
            {viewMode === 'map' && (
              <div className="absolute inset-0 bg-gray-200 h-[calc(100vh-8rem)]">
                <Map
                  currentLocation={{
                    latitude: location.latitude,
                    longitude: location.longitude
                  }}
                  nearbyUsers={nearbyUsers}
                  maxDistance={maxDistance}
                  onUserClick={handleUserClick}
                  showPlaces={true}
                />
                
                {!location.permissionGranted && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md text-center">
                      <MapPin className="h-12 w-12 text-primary mb-4 mx-auto" />
                      <h3 className="text-xl font-bold mb-2">Enable Location Services</h3>
                      <p className="text-gray-600 mb-4">
                        RAD.r needs access to your location to help you discover people nearby.
                      </p>
                      <Button className="mb-2">
                        Enable Location
                      </Button>
                      <div className="mt-2">
                        <ManualLocationSetter />
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        We value your privacy. Your location data is only used to show you relevant connections and is never shared without your permission.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Mobile List View */}
            {viewMode === 'list' && (
              <div className="h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-3">People nearby</h3>
                  <p className="text-sm text-gray-500 mb-4">Within 500 meters of your location</p>
                  
                  <div className="space-y-3">
                    {nearbyUsers.length > 0 ? (
                      nearbyUsers.map(user => (
                        <div key={user.id} className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <img
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-medium truncate">{user.name}</h4>
                              <p className="text-xs text-gray-600 truncate">{user.profession || 'No profession listed'}</p>
                              {user.bio && <p className="text-xs text-gray-500 line-clamp-1 mt-1">{user.bio}</p>}
                              
                              <div className="flex space-x-2 mt-2">
                                <Button size="sm" variant="outline" onClick={() => handleUserClick(user)}>View</Button>
                                <Button size="sm" variant="secondary" onClick={() => handleOpenMessaging(user)}>Message</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-medium text-gray-900 mb-1">No people found</h3>
                        <p className="text-sm text-gray-500">
                          No one is within 500 meters of your location right now
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Fixed Mobile Nav */}
            <div className="fixed bottom-0 left-0 w-full">
              <div className="bg-white border-t border-gray-200 p-2 flex justify-center space-x-6">
                <button
                  className={`flex flex-col items-center justify-center px-3 py-1 ${
                    viewMode === 'radar' ? 'text-primary' : 'text-gray-500'
                  }`}
                  onClick={() => setViewMode('radar')}
                >
                  <Zap className="w-5 h-5" />
                  <span className="text-xs mt-1">Radar</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center px-3 py-1 ${
                    viewMode === 'map' ? 'text-primary' : 'text-gray-500'
                  }`}
                  onClick={() => setViewMode('map')}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs mt-1">Map</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center px-3 py-1 ${
                    viewMode === 'list' ? 'text-primary' : 'text-gray-500'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-5 h-5" />
                  <span className="text-xs mt-1">List</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Add fixed position "Set Test Location" button in lower right corner for easy access */}
          {location.permissionGranted && (
            <div className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-10">
              <ManualLocationSetter />
            </div>
          )}
        </main>
      </div>
      
      {/* Mobile Nav */}
      <MobileNavigation />
      
      {/* Modals */}
      {selectedProfile && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={selectedProfile}
          onMessage={() => handleOpenMessaging(selectedProfile)}
        />
      )}
      
      <MessagingModal
        isOpen={showMessagingModal}
        onClose={() => setShowMessagingModal(false)}
        recipientId={messagingUser?.id}
        recipientName={messagingUser?.name || ''}
      />
    </div>
  );
};

export default DiscoverPage;