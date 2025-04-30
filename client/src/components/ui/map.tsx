import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow, Libraries } from '@react-google-maps/api';
import { UserProfile } from '@shared/schema';
import { fetchGoogleMapsApiKey } from '@/lib/env';
import { apiRequest } from '@/lib/queryClient';

// Define libraries array as a static constant outside the component to avoid performance warnings
// Using string array to avoid TypeScript issues
const libraries = ['places'] as Libraries;

// Interface for place data from API
interface Place {
  id: string;
  name: string;
  address: string;
  types?: string[];
  category?: string;
  rating?: number;
  location: {
    lat: number;
    lng: number;
  };
  photos?: string[];
}

interface MapProps {
  currentLocation: {
    latitude: number | null;
    longitude: number | null;
  };
  nearbyUsers: UserProfile[];
  maxDistance: number;
  onUserClick: (user: UserProfile) => void;
  showPlaces?: boolean; // Optional prop to control showing places
}

// Default map container styles
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Custom styled map
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Custom marker SVGs
const createSvgMarker = (color: string) => {
  const encodedSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="white" stroke="${color}" stroke-width="2"/>
      <circle cx="20" cy="20" r="15" fill="${color}" fill-opacity="0.8"/>
      <path d="M20 12a4 4 0 100 8 4 4 0 000-8zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>
    </svg>
  `);
  return `data:image/svg+xml;charset=UTF-8,${encodedSvg}`;
};

const userMarkerIcon = createSvgMarker('#EC4899'); // Secondary color
const nearbyUserMarkerIcon = createSvgMarker('#4F46E5'); // Primary color

// Create marker icons for different place types
const createPlaceMarker = (type: string) => {
  let icon = '';
  let color = '';
  
  switch (type) {
    case 'restaurant':
      icon = 'M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.5';
      color = '#F97316'; // Orange
      break;
    case 'cafe':
      icon = 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v6M10 2v6M14 2v6';
      color = '#6D28D9'; // Purple
      break;
    case 'shopping':
    case 'mall':
    case 'store':
      icon = 'M15.5 7.5a2.5 2.5 0 0 0-5 0m5 0v8a2.5 2.5 0 0 1-5 0m5 0a2.5 2.5 0 0 0 5 0V7.5a2.5 2.5 0 0 0-5 0m5 0v8a2.5 2.5 0 0 1-5 0m-5-8a2.5 2.5 0 0 1 5 0m-5 0v8a2.5 2.5 0 0 0 5 0m-5 0a2.5 2.5 0 0 1-5 0V7.5a2.5 2.5 0 0 1 5 0m-5 0v8a2.5 2.5 0 0 0 5 0';
      color = '#0EA5E9'; // Sky blue
      break;
    case 'park':
    case 'garden':
      icon = 'M8 16a5 5 0 0 1 1.747-3.8m8.506 0A5 5 0 0 1 16 16H8m11-10a3 3 0 0 1-4.53 2.59L12 8l-1.47.59A3 3 0 0 1 5 6c0-1.66 1.34-3 3-3 .97 0 1.84.46 2.38 1.18.54-.72 1.41-1.18 2.38-1.18a3 3 0 0 1 3 3';
      color = '#22C55E'; // Green
      break;
    case 'bar':
    case 'pub':
    case 'nightclub':
      icon = 'M8 22h8M7 10h10m-9-3v14m8-14v14M5 7h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1Z';
      color = '#BE185D'; // Pink
      break;
    case 'entertainment':
    case 'cinema':
    case 'theater':
      icon = 'M6 20h12M7 12v3m3-3v3m4-3v3m3-3v3M5 8h14M4 4h16';
      color = '#DC2626'; // Red
      break;
    default:
      icon = 'M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8 8-3.6 8-8zm-8 4.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z';
      color = '#64748B'; // Gray
  }
  
  const encodedSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="white" stroke="${color}" stroke-width="2"/>
      <circle cx="20" cy="20" r="15" fill="${color}" fill-opacity="0.7"/>
      <path d="${icon}" stroke="white" stroke-width="1.5" fill="none" transform="translate(8,8) scale(0.9)"/>
    </svg>
  `);
  
  return `data:image/svg+xml;charset=UTF-8,${encodedSvg}`;
};

const Map: React.FC<MapProps> = ({ 
  currentLocation, 
  nearbyUsers, 
  maxDistance,
  onUserClick,
  showPlaces = true // Default to showing places
}) => {
  // Handle null or undefined currentLocation
  const latitude = currentLocation?.latitude != null ? currentLocation.latitude : 0;
  const longitude = currentLocation?.longitude != null ? currentLocation.longitude : 0;
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  // State for API key
  const [apiKey, setApiKey] = useState<string>(window.ENV?.GOOGLE_MAPS_API_KEY || '');
  
  // Fetch API key from server if not available in window.ENV
  useEffect(() => {
    if (!apiKey) {
      fetchGoogleMapsApiKey().then(key => {
        if (key) {
          setApiKey(key);
        }
      });
    }
  }, []);

  // Load the Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries
  });

  // Save map instance for reuse
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Center the map when location changes
  useEffect(() => {
    if (map && latitude && longitude) {
      map.panTo({ lat: latitude, lng: longitude });
    }
  }, [map, latitude, longitude]);

  // Clear map instance when component unmounts
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle user marker click
  const handleMarkerClick = (user: UserProfile) => {
    setSelectedUser(user);
    onUserClick(user);
  };

  // Close info window
  const handleInfoWindowClose = () => {
    setSelectedUser(null);
  };
  
  // Handle place marker click
  const handlePlaceMarkerClick = (place: Place) => {
    setSelectedPlace(place);
  };
  
  // Close place info window
  const handlePlaceInfoWindowClose = () => {
    setSelectedPlace(null);
  };
  
  // Fetch nearby places
  useEffect(() => {
    const fetchPlaces = async () => {
      if (!showPlaces || !latitude || !longitude) return;
      
      setIsLoadingPlaces(true);
      try {
        const radius = maxDistance * 1609.34; // Convert miles to meters
        const response = await fetch(`/api/location/places?lat=${latitude}&lng=${longitude}&radius=${radius}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch places');
        }
        
        const data = await response.json();
        if (data.results && Array.isArray(data.results)) {
          setPlaces(data.results);
        }
      } catch (error) {
        console.error('Error fetching places:', error);
      } finally {
        setIsLoadingPlaces(false);
      }
    };
    
    fetchPlaces();
  }, [latitude, longitude, maxDistance, showPlaces]);

  // Show loading or error state
  if (loadError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-500 font-semibold mb-2">Error loading map: {loadError.message}</p>
        <p className="text-sm text-gray-600 text-center">
          There may be an issue with the Google Maps API key. Please try again later or contact support.
        </p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            // Force refresh API key from server
            fetchGoogleMapsApiKey().then(key => {
              if (key) {
                setApiKey(key);
                window.location.reload(); // Reload the page to reinitialize Google Maps
              }
            });
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoaded || !apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Waiting for location...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={{ lat: latitude, lng: longitude }}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* Current user location */}
      <Marker
        position={{ lat: latitude, lng: longitude }}
        icon={{
          url: userMarkerIcon,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }}
      />
      
      {/* Distance circle */}
      {typeof maxDistance === 'number' && (
        <Circle
          center={{ lat: latitude, lng: longitude }}
          radius={maxDistance * 1609.34} // Convert miles to meters
          options={{
            fillColor: '#4F46E5',
            fillOpacity: 0.1,
            strokeColor: '#4F46E5',
            strokeWeight: 1
          }}
        />
      )}
      
      {/* Nearby users */}
      {nearbyUsers && Array.isArray(nearbyUsers) && nearbyUsers.map((user) => (
        user && user.latitude && user.longitude ? (
          <Marker
            key={user.id}
            position={{ lat: user.latitude, lng: user.longitude }}
            onClick={() => handleMarkerClick(user)}
            icon={{
              url: nearbyUserMarkerIcon,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20)
            }}
          />
        ) : null
      ))}
      
      {/* Info window for selected user */}
      {selectedUser && selectedUser.latitude && selectedUser.longitude && (
        <InfoWindow
          position={{ lat: selectedUser.latitude, lng: selectedUser.longitude }}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="p-1 text-center">
            <div className="font-semibold">{selectedUser.name}</div>
            <div className="text-sm text-gray-600">{selectedUser.profession}</div>
            <div className="text-xs text-gray-500">
              {selectedUser.distance !== undefined ? `${selectedUser.distance.toFixed(1)} mi away` : ''}
            </div>
          </div>
        </InfoWindow>
      )}
      
      {/* Nearby places markers */}
      {showPlaces && places && Array.isArray(places) && places.map((place) => {
        // Safety check for place and place location
        if (!place || !place.location || typeof place.location.lat !== 'number' || typeof place.location.lng !== 'number') {
          return null;
        }
        
        // Determine place type for the marker
        let placeType = 'default';
        if (place.types && place.types.length > 0) {
          // Use the first relevant type for the marker icon
          for (const type of place.types) {
            if (['restaurant', 'cafe', 'bar', 'shopping', 'park', 'entertainment', 'cinema'].includes(type)) {
              placeType = type;
              break;
            }
          }
        } else if (place.category) {
          placeType = place.category;
        }
        
        return (
          <Marker
            key={place.id}
            position={{ lat: place.location.lat, lng: place.location.lng }}
            onClick={() => handlePlaceMarkerClick(place)}
            icon={{
              url: createPlaceMarker(placeType),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16)
            }}
            zIndex={1} // Lower zIndex than user markers
          />
        );
      })}
      
      {/* Info window for selected place */}
      {selectedPlace && selectedPlace.location && typeof selectedPlace.location.lat === 'number' && typeof selectedPlace.location.lng === 'number' && (
        <InfoWindow
          position={{ lat: selectedPlace.location.lat, lng: selectedPlace.location.lng }}
          onCloseClick={handlePlaceInfoWindowClose}
        >
          <div className="p-2 max-w-[200px]">
            <div className="font-semibold">{selectedPlace.name}</div>
            {selectedPlace.address && (
              <div className="text-xs text-gray-600 mt-1">{selectedPlace.address}</div>
            )}
            {selectedPlace.rating && (
              <div className="text-xs text-yellow-600 mt-1">
                Rating: {selectedPlace.rating} ★
              </div>
            )}
            {selectedPlace.category && (
              <div className="text-xs text-blue-600 mt-1 capitalize">
                {selectedPlace.category}
              </div>
            )}
            {/* Show a small thumbnail if available */}
            {selectedPlace.photos && selectedPlace.photos.length > 0 && (
              <img 
                src={selectedPlace.photos[0]} 
                alt={selectedPlace.name}
                className="w-full h-20 object-cover mt-2 rounded"
              />
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default Map;
