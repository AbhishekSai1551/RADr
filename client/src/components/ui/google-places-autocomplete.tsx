import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { Loader2, X, MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/types/google-maps';

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  photos?: string[];
  rating?: number;
  types?: string[];
}

// Define a simplified interface for what we actually use from the Google Maps API
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: GooglePlace | null) => void;
  placeholder?: string;
  city?: string;
  className?: string;
  defaultValue?: string;
  showClear?: boolean;
}

export function GooglePlacesAutocomplete({
  onPlaceSelect,
  placeholder = 'Search for a place...',
  city = '',
  className,
  defaultValue = '',
  showClear = true,
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const autocompleteSessionToken = useRef<any>(null);
  const dummyMapDiv = useRef<HTMLDivElement>(null);

  // Initialize Google Places services
  useEffect(() => {
    // Check if the Google Maps API is loaded
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        if (!autocompleteService.current) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
        
        if (!placesService.current && dummyMapDiv.current) {
          placesService.current = new window.google.maps.places.PlacesService(dummyMapDiv.current);
        }
        
        if (!autocompleteSessionToken.current) {
          // Using type assertion to handle Google Maps API types
          autocompleteSessionToken.current = new (window.google.maps.places as any).AutocompleteSessionToken();
        }
        window.googleMapsLoaded = true;
        return true;
      }
      return false;
    };

    // Try to initialize, and if not loaded yet, set up a periodic check
    if (!checkGoogleMapsLoaded()) {
      const intervalId = setInterval(() => {
        if (checkGoogleMapsLoaded()) {
          clearInterval(intervalId);
        }
      }, 500);
      
      // Clear the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, []);

  // Handle search
  useEffect(() => {
    if (!inputValue.trim() || !autocompleteService.current) return;

    const delayDebounce = setTimeout(() => {
      setLoading(true);
      
      const request = {
        input: inputValue,
        sessionToken: autocompleteSessionToken.current,
      };
      
      // Add location bias for the city if provided
      if (city) {
        // @ts-ignore - We know these properties exist
        request.types = ['establishment'];
      }

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions: PlacePrediction[] | null, status: string) => {
          setLoading(false);
          
          if (status === "OK" && predictions) {
            setPredictions(predictions);
          } else {
            console.warn('Place predictions request status:', status);
            setPredictions([]);
          }
        }
      );
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [inputValue, city]);

  const handleSelect = (placeId: string) => {
    if (!placesService.current) return;

    setLoading(true);
    placesService.current.getDetails(
      {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'types'],
        sessionToken: autocompleteSessionToken.current,
      },
      (placeResult: any, status: string) => {
        setLoading(false);
        
        if (status === "OK" && placeResult) {
          const place: GooglePlace = {
            place_id: placeResult.place_id || '',
            name: placeResult.name || '',
            formatted_address: placeResult.formatted_address || '',
            rating: placeResult.rating,
            types: placeResult.types,
            photos: placeResult.photos?.map((photo: any) => 
              photo.getUrl({ maxWidth: 400, maxHeight: 400 })
            ),
          };
          
          setSelectedPlace(place);
          setInputValue(`${place.name} - ${place.formatted_address}`);
          onPlaceSelect(place);
          setOpen(false);
          
          // Reset the session token after a selection is made
          if (window.google?.maps?.places) {
            // Using type assertion to handle Google Maps API types
            autocompleteSessionToken.current = new (window.google.maps.places as any).AutocompleteSessionToken();
          }
        } else {
          console.error('Place details request failed:', status);
        }
      }
    );
  };

  const clearSelection = () => {
    setSelectedPlace(null);
    setInputValue('');
    onPlaceSelect(null);
  };

  // Check if the Google Maps API is loaded
  useEffect(() => {
    const checkApiLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setApiLoaded(true);
        setError(null);
      } else {
        setApiLoaded(false);
        setError("Google Maps API not available. Please try the suggested venues or custom location.");
      }
    };
    
    // Initial check
    checkApiLoaded();
    
    // Set up a periodic check
    const intervalId = setInterval(checkApiLoaded, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Invisible element needed for PlacesService */}
      <div ref={dummyMapDiv} style={{ display: 'none' }}></div>
      
      {error && (
        <div className="mb-3 p-3 border border-amber-300 bg-amber-50 text-amber-800 rounded-md text-sm">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="font-medium">API Service Unavailable</span>
          </div>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              onClick={() => setOpen(true)}
              className="w-full pr-8"
              disabled={!!error}
            />
            {showClear && inputValue && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        {!error && (
          <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
            <Command>
              <CommandList>
                {loading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <CommandEmpty>
                  {inputValue.length > 0 ? 'No places found' : 'Start typing to search places'}
                </CommandEmpty>
                <CommandGroup>
                  {predictions.map((prediction) => (
                    <CommandItem
                      key={prediction.place_id}
                      onSelect={() => handleSelect(prediction.place_id)}
                      className="py-2 px-2"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {prediction.structured_formatting.main_text}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {prediction.structured_formatting.secondary_text}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}