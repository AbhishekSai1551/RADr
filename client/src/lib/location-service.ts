import { apiRequest } from "./queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { env, fetchGoogleMapsApiKey } from "./env";

export interface LocationDetails {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  details: LocationDetails;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
  try {
    const response = await apiRequest("GET", `/api/location/reverse?lat=${latitude}&lng=${longitude}`);
    return await response.json();
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await apiRequest("GET", `/api/location/geocode?address=${encodedAddress}`);
    return await response.json();
  } catch (error) {
    console.error("Error during geocoding:", error);
    return null;
  }
}

export function useUserLocation() {
  const { toast } = useToast();
  
  const { data: locationInfo, isLoading, error } = useQuery({
    queryKey: ['/api/location/info'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/location/info");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateLocationMutation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      return apiRequest("PUT", "/api/location", { latitude, longitude });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/location/info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nearby'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating location",
        description: error.message || "Failed to update your location",
        variant: "destructive",
      });
    },
  });
  
  return {
    locationInfo,
    isLoading,
    error,
    updateLocation: (latitude: number, longitude: number) => 
      updateLocationMutation.mutate({ latitude, longitude }),
    isUpdating: updateLocationMutation.isPending,
  };
}

export function useNearbyPlaces(
  latitude: number | null, 
  longitude: number | null, 
  type: string = 'restaurant', 
  radius: number = 500
) {
  return useQuery({
    queryKey: ['/api/location/places', { latitude, longitude, type, radius }],
    queryFn: async () => {
      if (!latitude || !longitude) return null;
      
      const res = await apiRequest(
        "GET", 
        `/api/location/places?lat=${latitude}&lng=${longitude}&type=${type}&radius=${radius}`
      );
      return res.json();
    },
    enabled: !!latitude && !!longitude,
  });
}

// Interface for Google Places predictions
export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Hook to use server-side Places Autocomplete API
export function usePlacesAutocomplete(inputValue: string, options?: {
  debounce?: number;
}) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const { debounce = 300 } = options || {};

  // Get predictions when input value changes
  useEffect(() => {
    // Clear previous timer if it exists
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Reset predictions if input is empty
    if (!inputValue.trim()) {
      setPredictions([]);
      return;
    }
    
    // Set a timer to fetch predictions after debounce time
    debounceTimer.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call our server-side location suggestions API
        const response = await fetch(`/api/location/suggestions?query=${encodeURIComponent(inputValue)}`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setPredictions(data);
        } else {
          setPredictions([]);
        }
      } catch (err) {
        setLoading(false);
        setError('Error fetching place predictions');
        console.error('Places Autocomplete Error:', err);
      } finally {
        setLoading(false);
      }
    }, debounce);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [inputValue, debounce]);

  // Function to get place details from a prediction
  const getPlaceDetails = async (placeId: string): Promise<GeocodingResult | null> => {
    try {
      // Get the place details from our server-side API
      const response = await apiRequest("GET", `/api/location/geocode?place_id=${encodeURIComponent(placeId)}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  };

  return { predictions, loading, error, getPlaceDetails };
}

// Add this to global Window interface
declare global {
  interface Window {
    ENV?: {
      GOOGLE_MAPS_API_KEY: string;
    };
    google?: {
      maps?: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              options: any,
              callback: (predictions: PlacePrediction[] | null, status: string) => void
            ) => void;
          };
          PlacesService: new (
            attrContainer: HTMLElement
          ) => {
            getDetails: (
              options: any,
              callback: (place: any | null, status: string) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            [key: string]: string;
          };
        };
        GeocoderAddressComponent: any;
      };
    };
  }
}