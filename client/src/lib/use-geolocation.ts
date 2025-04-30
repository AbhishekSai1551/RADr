import { useState, useEffect } from "react";
import { apiRequest } from "./queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { reverseGeocode } from "./location-service";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionGranted: boolean;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  locationAvailable: boolean;
}

export const useGeolocation = (
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  },
  updateServer: boolean = true
) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permissionGranted: false,
    locationAvailable: false
  });
  const { toast } = useToast();

  // Fetch existing location info from server first
  const { data: locationInfo } = useQuery({
    queryKey: ['/api/location/info'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/location/info");
        return res.json();
      } catch (error) {
        console.error("Error fetching location info:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set initial location from server data
  useEffect(() => {
    if (locationInfo && locationInfo.hasLocation) {
      setState(prevState => ({
        ...prevState,
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
        city: locationInfo.city,
        state: locationInfo.state,
        country: locationInfo.country,
        address: locationInfo.address,
        loading: false,
        permissionGranted: true,
        locationAvailable: true
      }));
    }
  }, [locationInfo]);

  // Then try to get current position from browser
  useEffect(() => {
    const onSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      setState(prevState => ({
        ...prevState,
        latitude,
        longitude,
        error: null,
        loading: false,
        permissionGranted: true,
        locationAvailable: true
      }));

      // Try to get location details using reverse geocoding
      const geocodeResult = await reverseGeocode(latitude, longitude);
      
      if (geocodeResult) {
        setState(prevState => ({
          ...prevState,
          city: geocodeResult.details.city,
          state: geocodeResult.details.state,
          country: geocodeResult.details.country,
          address: geocodeResult.formattedAddress
        }));
      }

      if (updateServer) {
        try {
          await apiRequest("PUT", "/api/location", { latitude, longitude });
        } catch (error: any) {
          toast({
            title: "Error updating location",
            description: error.message || "Failed to update your location on the server",
            variant: "destructive",
          });
        }
      }
    };

    const onError = (error: GeolocationPositionError) => {
      setState(prevState => ({
        ...prevState,
        error: error.message,
        loading: false,
        permissionGranted: false,
        // Keep existing location data if available
        locationAvailable: !!(prevState.latitude && prevState.longitude)
      }));

      // Only show error toast if we don't have a fallback location
      if (!state.latitude || !state.longitude) {
        toast({
          title: "Location Error",
          description: `Could not get your location: ${error.message}`,
          variant: "destructive",
        });
      }
    };

    if (!navigator.geolocation) {
      setState(prevState => ({
        ...prevState,
        error: "Geolocation is not supported by your browser",
        loading: false,
        // Keep existing location data if available
        locationAvailable: !!(prevState.latitude && prevState.longitude)
      }));
      return;
    }

    const watcher = navigator.geolocation.watchPosition(onSuccess, onError, options);

    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, []);

  const requestLocationAccess = () => {
    if (navigator.geolocation) {
      setState(prevState => ({
        ...prevState,
        loading: true
      }));
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          setState(prevState => ({
            ...prevState,
            latitude,
            longitude,
            error: null,
            loading: false,
            permissionGranted: true,
            locationAvailable: true
          }));
          
          if (updateServer) {
            try {
              await apiRequest("PUT", "/api/location", { latitude, longitude });
              
              // Try to get location details using reverse geocoding
              const geocodeResult = await reverseGeocode(latitude, longitude);
              
              if (geocodeResult) {
                setState(prevState => ({
                  ...prevState,
                  city: geocodeResult.details.city,
                  state: geocodeResult.details.state,
                  country: geocodeResult.details.country,
                  address: geocodeResult.formattedAddress
                }));
              }
              
              toast({
                title: "Location Updated",
                description: "Your location has been successfully updated",
              });
            } catch (error: any) {
              toast({
                title: "Error updating location",
                description: error.message || "Failed to update your location",
                variant: "destructive",
              });
            }
          }
        },
        (error) => {
          setState(prevState => ({
            ...prevState,
            error: error.message,
            loading: false,
            permissionGranted: false,
            // Keep existing location data if available
            locationAvailable: !!(prevState.latitude && prevState.longitude)
          }));
          
          toast({
            title: "Location Error",
            description: `Could not get your location: ${error.message}`,
            variant: "destructive",
          });
        },
        options
      );
    } else {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
    }
  };

  return {
    ...state,
    requestLocationAccess
  };
};
