import { Fragment, useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, AlertCircle, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Place {
  id: string;
  name: string;
  address: string;
  rating?: number;
  photos?: string[];
}

interface PlaceInCityAutocompleteProps {
  city: string;
  onSelect: (place: Place | null) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  showImages?: boolean;
}

export function PlaceInCityAutocomplete({
  city,
  onSelect,
  placeholder = 'Select a place...',
  type = '',
  className,
  showImages = false,
}: PlaceInCityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!city) {
      setPlaces([]);
      setError(null);
      return;
    }

    // Only load places when the popover is opened
    if (open) {
      fetchPlaces();
    }
  }, [city, open, type]);

  const fetchPlaces = async () => {
    if (!city) return;

    setLoading(true);
    setError(null);
    setApiMessage(null);
    
    try {
      const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
      const response = await fetch(`/api/location/places-in-city?city=${encodeURIComponent(city)}${typeParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch places');
      }
      
      const data = await response.json();
      
      // Check for API errors or messages
      if (data.error) {
        setError(data.error.message || 'API Error');
      }
      
      if (data.message) {
        setApiMessage(data.message);
      }
      
      if (data.results && Array.isArray(data.results)) {
        setPlaces(data.results);
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setError('Failed to load places for this city');
      toast({
        title: 'Error',
        description: 'Failed to load places for this city',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place: Place) => {
    setSelectedPlace(place);
    onSelect(place);
    setOpen(false);
  };
  
  const handleRetry = () => {
    fetchPlaces();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedPlace ? (
            <span className="truncate">{selectedPlace.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" side="bottom" sideOffset={8} style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput
            placeholder={`Search places in ${city}...`}
            className="h-9"
            onFocus={fetchPlaces}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            {!loading && error && (
              <div className="p-4">
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button size="sm" onClick={handleRetry} className="w-full">
                  Retry
                </Button>
              </div>
            )}
            
            {!loading && apiMessage && places.length > 0 && (
              <div className="px-4 pt-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  {apiMessage.includes("fallback") ? "Using suggested venues" : apiMessage}
                </Badge>
              </div>
            )}
            
            <CommandEmpty>No places found</CommandEmpty>
            <CommandGroup>
              {places.map((place) => (
                <CommandItem
                  key={place.id}
                  onSelect={() => handleSelect(place)}
                  className="flex flex-col items-start py-2"
                >
                  <div className="flex w-full items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedPlace?.id === place.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-grow">
                      <p className="text-sm font-medium">{place.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                      {place.rating && (
                        <div className="flex items-center mt-1">
                          <span className="text-xs mr-1">Rating: {place.rating}</span>
                          <div className="flex">
                            {[...Array(Math.round(place.rating))].map((_, i) => (
                              <span key={i} className="text-yellow-500 text-xs">★</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {showImages && place.photos && place.photos.length > 0 && (
                    <div className="w-full mt-2 flex space-x-1 overflow-x-auto">
                      {place.photos.slice(0, 3).map((photo, index) => (
                        <img 
                          key={index}
                          src={photo}
                          alt={`${place.name} photo ${index + 1}`}
                          className="h-16 w-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}