import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, AlertCircle, Map as MapIcon, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useGeolocation } from '@/lib/use-geolocation';
import { geocodeAddress, usePlacesAutocomplete, PlacePrediction } from '@/lib/location-service';
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete';
import { CityAutocomplete } from '@/components/ui/city-autocomplete';
import { VenueAutocomplete } from '@/components/ui/venue-autocomplete';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { PlaceInCityAutocomplete } from '@/components/ui/place-in-city-autocomplete';

interface CreateZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Common venues suggestions for users to select from
const venueSuggestions = [
  // Visakhapatnam locations (listed first as preferred defaults)
  { id: "1", name: "Jagadamba Theatre", address: "Jagadamba Junction, Visakhapatnam" },
  { id: "2", name: "RK Beach", address: "Beach Road, Visakhapatnam" },
  { id: "3", name: "CMR Central Mall", address: "Maddilapalem, Visakhapatnam" },
  { id: "4", name: "Tenneti Park", address: "Beach Road, Visakhapatnam" },
  { id: "5", name: "Inox Multiplex", address: "Siripuram, Visakhapatnam" },
  { id: "6", name: "Submarine Museum", address: "Beach Road, Visakhapatnam" },
  // Generic locations
  { id: "7", name: "Downtown Coffee Shop", address: "123 Main St, Downtown" },
  { id: "8", name: "Central Park", address: "Central Park, Midtown" },
  { id: "9", name: "Tech Hub Coworking", address: "456 Innovation Ave, Tech District" },
  { id: "10", name: "University Campus", address: "789 University Blvd, Education Quarter" },
  { id: "11", name: "Sports Complex", address: "101 Athletic Dr, Sports Village" },
  { id: "12", name: "Library", address: "202 Knowledge St, Cultural District" },
  { id: "13", name: "Beachside Bar", address: "303 Ocean View, Beachfront" },
  { id: "14", name: "Mountain Hiking Trail", address: "404 Mountain Path, Nature Reserve" },
  { id: "15", name: "Art Gallery", address: "505 Creative Ln, Arts District" },
];

const commonTimeOptions = [
  { value: "08:00 AM", label: "08:00 AM - Morning" },
  { value: "12:00 PM", label: "12:00 PM - Lunch" },
  { value: "03:00 PM", label: "03:00 PM - Afternoon" },
  { value: "06:00 PM", label: "06:00 PM - Evening" },
  { value: "08:00 PM", label: "08:00 PM - Night" }
];

// Comprehensive list of major global cities for the zone
const cityOptions = [
  // India
  { value: "visakhapatnam", label: "Visakhapatnam, India" },
  { value: "hyderabad", label: "Hyderabad, India" },
  { value: "bangalore", label: "Bangalore, India" },
  { value: "chennai", label: "Chennai, India" },
  { value: "mumbai", label: "Mumbai, India" },
  { value: "delhi", label: "Delhi, India" },
  { value: "kolkata", label: "Kolkata, India" },
  { value: "ahmedabad", label: "Ahmedabad, India" },
  { value: "pune", label: "Pune, India" },
  { value: "jaipur", label: "Jaipur, India" },
  { value: "lucknow", label: "Lucknow, India" },
  { value: "kanpur", label: "Kanpur, India" },
  { value: "nagpur", label: "Nagpur, India" },
  { value: "indore", label: "Indore, India" },
  { value: "thane", label: "Thane, India" },
  { value: "bhopal", label: "Bhopal, India" },
  { value: "patna", label: "Patna, India" },
  { value: "coimbatore", label: "Coimbatore, India" },
  { value: "kochi", label: "Kochi, India" },
  { value: "nashik", label: "Nashik, India" },
  { value: "faridabad", label: "Faridabad, India" },
  { value: "meerut", label: "Meerut, India" },
  { value: "rajkot", label: "Rajkot, India" },
  { value: "kalyan", label: "Kalyan, India" },
  { value: "vasai", label: "Vasai, India" },
  { value: "varanasi", label: "Varanasi, India" },
  { value: "srinagar", label: "Srinagar, India" },
  { value: "aurangabad", label: "Aurangabad, India" },
  { value: "dhanbad", label: "Dhanbad, India" },
  { value: "amritsar", label: "Amritsar, India" },
  { value: "navi-mumbai", label: "Navi Mumbai, India" },
  { value: "allahabad", label: "Allahabad, India" },
  { value: "ranchi", label: "Ranchi, India" },
  { value: "gwalior", label: "Gwalior, India" },
  { value: "jabalpur", label: "Jabalpur, India" },
  { value: "vijayawada", label: "Vijayawada, India" },
  { value: "jodhpur", label: "Jodhpur, India" },
  { value: "madurai", label: "Madurai, India" },
  { value: "raipur", label: "Raipur, India" },
  { value: "kota", label: "Kota, India" },
  { value: "chandigarh", label: "Chandigarh, India" },
  { value: "guwahati-1", label: "Guwahati, India" },
  { value: "solapur", label: "Solapur, India" },
  
  // United States
  { value: "new-york", label: "New York City, USA" },
  { value: "los-angeles", label: "Los Angeles, USA" },
  { value: "chicago", label: "Chicago, USA" },
  { value: "houston", label: "Houston, USA" },
  { value: "phoenix", label: "Phoenix, USA" },
  { value: "philadelphia", label: "Philadelphia, USA" },
  { value: "san-antonio", label: "San Antonio, USA" },
  { value: "san-diego", label: "San Diego, USA" },
  { value: "dallas", label: "Dallas, USA" },
  { value: "san-jose", label: "San Jose, USA" },
  { value: "austin", label: "Austin, USA" },
  { value: "fort-worth", label: "Fort Worth, USA" },
  { value: "jacksonville", label: "Jacksonville, USA" },
  { value: "columbus", label: "Columbus, USA" },
  { value: "charlotte", label: "Charlotte, USA" },
  { value: "san-francisco", label: "San Francisco, USA" },
  { value: "indianapolis", label: "Indianapolis, USA" },
  { value: "seattle", label: "Seattle, USA" },
  { value: "denver", label: "Denver, USA" },
  { value: "washington-dc", label: "Washington D.C., USA" },
  { value: "boston", label: "Boston, USA" },
  { value: "nashville", label: "Nashville, USA" },
  { value: "baltimore", label: "Baltimore, USA" },
  { value: "portland", label: "Portland, USA" },
  { value: "las-vegas", label: "Las Vegas, USA" },
  
  // Europe
  { value: "london", label: "London, UK" },
  { value: "berlin", label: "Berlin, Germany" },
  { value: "madrid", label: "Madrid, Spain" },
  { value: "rome", label: "Rome, Italy" },
  { value: "paris", label: "Paris, France" },
  { value: "barcelona", label: "Barcelona, Spain" },
  { value: "vienna", label: "Vienna, Austria" },
  { value: "hamburg", label: "Hamburg, Germany" },
  { value: "munich", label: "Munich, Germany" },
  { value: "milan", label: "Milan, Italy" },
  { value: "prague", label: "Prague, Czech Republic" },
  { value: "budapest", label: "Budapest, Hungary" },
  { value: "warsaw", label: "Warsaw, Poland" },
  { value: "stockholm", label: "Stockholm, Sweden" },
  { value: "amsterdam", label: "Amsterdam, Netherlands" },
  { value: "bucharest", label: "Bucharest, Romania" },
  { value: "copenhagen", label: "Copenhagen, Denmark" },
  { value: "dublin", label: "Dublin, Ireland" },
  { value: "athens", label: "Athens, Greece" },
  { value: "lisbon", label: "Lisbon, Portugal" },
  { value: "helsinki", label: "Helsinki, Finland" },
  { value: "brussels", label: "Brussels, Belgium" },
  { value: "oslo", label: "Oslo, Norway" },
  { value: "zurich", label: "Zurich, Switzerland" },
  { value: "manchester", label: "Manchester, UK" },
  
  // Asia (excluding India)
  { value: "tokyo", label: "Tokyo, Japan" },
  { value: "shanghai", label: "Shanghai, China" },
  { value: "beijing", label: "Beijing, China" },
  { value: "guangzhou", label: "Guangzhou, China" },
  { value: "seoul", label: "Seoul, South Korea" },
  { value: "jakarta", label: "Jakarta, Indonesia" },
  { value: "bangkok", label: "Bangkok, Thailand" },
  { value: "singapore", label: "Singapore" },
  { value: "kuala-lumpur", label: "Kuala Lumpur, Malaysia" },
  { value: "manila", label: "Manila, Philippines" },
  { value: "hong-kong", label: "Hong Kong" },
  { value: "taipei", label: "Taipei, Taiwan" },
  { value: "ho-chi-minh", label: "Ho Chi Minh City, Vietnam" },
  { value: "hanoi", label: "Hanoi, Vietnam" },
  { value: "riyadh", label: "Riyadh, Saudi Arabia" },
  { value: "dubai", label: "Dubai, UAE" },
  { value: "abu-dhabi", label: "Abu Dhabi, UAE" },
  { value: "istanbul", label: "Istanbul, Turkey" },
  
  // Australia/Oceania
  { value: "sydney", label: "Sydney, Australia" },
  { value: "melbourne", label: "Melbourne, Australia" },
  { value: "brisbane", label: "Brisbane, Australia" },
  { value: "perth", label: "Perth, Australia" },
  { value: "adelaide", label: "Adelaide, Australia" },
  { value: "auckland", label: "Auckland, New Zealand" },
  { value: "wellington", label: "Wellington, New Zealand" },
  
  // Mexico & South America
  { value: "mexico-city", label: "Mexico City, Mexico" },
  { value: "sao-paulo", label: "São Paulo, Brazil" },
  { value: "rio-de-janeiro", label: "Rio de Janeiro, Brazil" },
  { value: "buenos-aires", label: "Buenos Aires, Argentina" },
  { value: "santiago", label: "Santiago, Chile" },
  { value: "lima", label: "Lima, Peru" },
  { value: "bogota", label: "Bogotá, Colombia" },
  { value: "caracas", label: "Caracas, Venezuela" },
  
  // Africa
  { value: "cairo", label: "Cairo, Egypt" },
  { value: "lagos", label: "Lagos, Nigeria" },
  { value: "johannesburg", label: "Johannesburg, South Africa" },
  { value: "cape-town", label: "Cape Town, South Africa" },
  { value: "nairobi", label: "Nairobi, Kenya" },
  { value: "casablanca", label: "Casablanca, Morocco" },
  { value: "accra", label: "Accra, Ghana" },
  { value: "addis-ababa", label: "Addis Ababa, Ethiopia" },
  { value: "dar-es-salaam", label: "Dar es Salaam, Tanzania" },
  { value: "tunis", label: "Tunis, Tunisia" },
  
  // Canada
  { value: "toronto", label: "Toronto, Canada" },
  { value: "montreal", label: "Montreal, Canada" },
  { value: "vancouver", label: "Vancouver, Canada" },
  { value: "calgary", label: "Calgary, Canada" },
  { value: "ottawa", label: "Ottawa, Canada" },
  { value: "edmonton", label: "Edmonton, Canada" }
];

const CreateZoneModal: React.FC<CreateZoneModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [customLocation, setCustomLocation] = useState(true);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [city, setCity] = useState('');
  const [participantLimit, setParticipantLimit] = useState<number | ''>('');
  const [places, setPlaces] = useState<any[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<any[]>([]);
  const [placeSearchTerm, setPlaceSearchTerm] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user's location
  const locationState = useGeolocation();
  
  // Location info available but not auto-filled
  // We no longer automatically set the city based on user's location
  
  // Fetch places when a city is selected
  useEffect(() => {
    const fetchPlaces = async () => {
      if (city) {
        try {
          // Get the cityLabel from our options
          const cityOption = cityOptions.find(opt => opt.value === city);
          if (cityOption) {
            const cityName = cityOption.label.split(',')[0]; // Extract just the city name
            toast({
              title: "Loading places...",
              description: `Fetching popular venues in ${cityName}. Please wait a moment.`,
              duration: 2000,
            });
            
            const response = await fetch(`/api/location/places-in-city?city=${encodeURIComponent(cityName)}`);
            if (response.ok) {
              const data = await response.json();
              
              // Check for API errors
              if (data.error) {
                console.warn("API returned an error:", data.error);
                toast({
                  title: "API Service Issue",
                  description: `Using suggested venues as Google Places API returned: ${data.error.message}`,
                  variant: "destructive",
                  duration: 5000,
                });
              }
              
              // Make sure we're handling the data format correctly
              if (data.results && Array.isArray(data.results)) {
                setPlaces(data.results);
                setFilteredPlaces(data.results);
                if (data.results.length > 0) {
                  toast({
                    title: "Places loaded",
                    description: `Found ${data.results.length} venues in ${cityName}`,
                    duration: 3000,
                  });
                }
              } else {
                setPlaces([]);
                setFilteredPlaces([]);
                toast({
                  title: "No results",
                  description: `No venues found in ${cityName}`,
                  variant: "destructive",
                  duration: 3000,
                });
              }
            } else {
              console.error("Failed to fetch places for city:", await response.text());
              setPlaces([]);
              toast({
                title: "Error",
                description: "Failed to fetch places for this city",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching places:", error);
          setPlaces([]);
          toast({
            title: "Error",
            description: "An error occurred while fetching places",
            variant: "destructive",
          });
        }
      } else {
        setPlaces([]);
      }
    };
    
    fetchPlaces();
  }, [city, toast]);
  
  // Simply update location value without auto-detecting city
  const handleLocationInput = (value: string) => {
    setLocation(value);
    // We no longer do automatic city detection here
  };
  
  // Real API mutation
  const createZoneMutation = useMutation({
    mutationFn: async (zoneData: {
      title: string;
      description: string;
      location: string;
      date: string | null;
      time: string;
      city: string;
      participantLimit?: number;
    }) => {
      // Make the actual API call
      return apiRequest('POST', '/api/zones', zoneData);
    },
    onSuccess: () => {
      // Invalidate and refetch queries that might have changed
      queryClient.invalidateQueries({ queryKey: ['/api/zones'] });
      
      // Show success toast
      toast({
        title: 'Zone created successfully!',
        description: 'Your new zone has been created and is now visible to users in the selected city.',
      });
      
      // Close modal and reset form
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create zone',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      toast({
        title: 'Title is required',
        variant: 'destructive'
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: 'Description is required',
        variant: 'destructive'
      });
      return;
    }
    
    if (!city.trim()) {
      toast({
        title: 'City is required',
        variant: 'destructive',
        description: 'Only users in the selected city will see this zone'
      });
      return;
    }
    
    if (!location.trim()) {
      toast({
        title: 'Location is required',
        variant: 'destructive'
      });
      return;
    }
    
    if (!date) {
      toast({
        title: 'Date is required',
        variant: 'destructive'
      });
      return;
    }
    
    // Handle time validation based on whether it's custom or preset
    let finalTime = time;
    if (time === 'custom') {
      if (!customTime.trim()) {
        toast({
          title: 'Custom time is required',
          variant: 'destructive'
        });
        return;
      }
      finalTime = customTime;
    } else if (!time.trim()) {
      toast({
        title: 'Time is required',
        variant: 'destructive'
      });
      return;
    }
    
    // Format the date as an ISO string to ensure it's properly sent as a date
    createZoneMutation.mutate({
      title,
      description,
      location,
      date: date ? date.toISOString() : null,
      time: finalTime,
      city,
      participantLimit: participantLimit === '' ? 0 : participantLimit // 0 means no limit
    } as any); // Use type assertion to avoid TypeScript error
  };
  
  // Handle venue selection from dropdown
  const handleVenueSelect = (value: string) => {
    if (value === "custom") {
      setCustomLocation(true);
      setLocation('');
    } else {
      const venue = venueSuggestions.find(v => v.id === value);
      if (venue) {
        setCustomLocation(false);
        setLocation(`${venue.name} - ${venue.address}`);
        setSelectedVenue(value);
      }
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setSelectedVenue('');
    setCustomLocation(true);
    setDate(null);
    setTime('');
    setCustomTime('');
    setCity('');
    setParticipantLimit('');
    setPlaces([]);
    setFilteredPlaces([]);
    setPlaceSearchTerm('');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Zone</DialogTitle>
          <DialogDescription>
            Create a zone event for people to join and meet up
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-4">
          {/* First row: Title and City */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Coffee Meetup, Basketball Game"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <CityAutocomplete
                value={city}
                onChange={setCity}
                cities={cityOptions}
                placeholder="Type to search cities..."
                onCitySelect={(value, label) => {
                  setCity(value);
                  toast({
                    title: "City Selected",
                    description: `You've selected ${label} as the zone location.`
                  });
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">* Only users in this city can see and join this zone</p>
            </div>
          </div>
          
          {/* Second row: Description */}
          <div className="mb-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell others what this zone is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          {/* Third row: Venue */}
          <div className="mb-4">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              
              {city ? (
                <>
                  {/* Show tabs for different venue selection methods */}
                  <Tabs defaultValue="google" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="google">Google Places</TabsTrigger>
                      <TabsTrigger value="suggestions">Venue Suggestions</TabsTrigger>
                      <TabsTrigger value="custom">Custom Location</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="google" className="pt-4">
                      <div className="flex flex-col space-y-4">
                        <Alert className="mb-2">
                          <MapIcon className="h-4 w-4" />
                          <AlertTitle>Google Places Integration</AlertTitle>
                          <AlertDescription>
                            Search for real venues using Google Maps data. If Google Places API is unavailable, you'll see suggested venues.
                          </AlertDescription>
                        </Alert>
                        
                        <GooglePlacesAutocomplete
                          placeholder={`Search venues in ${city}...`}
                          city={city ? cityOptions.find(opt => opt.value === city)?.label.split(',')[0] || '' : ''}
                          onPlaceSelect={(place) => {
                            if (place) {
                              setLocation(`${place.name} - ${place.formatted_address}`);
                              setCustomLocation(false);
                            } else {
                              setLocation('');
                            }
                          }}
                          className="w-full"
                        />
                        
                        {/* Display places returned from the API */}
                        {places.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium mb-2">
                              Places in {city ? cityOptions.find(opt => opt.value === city)?.label.split(',')[0] : ''} 
                              {placeSearchTerm ? (
                                <span>
                                  ({filteredPlaces.length} of {places.length} places match "{placeSearchTerm}")
                                </span>
                              ) : (
                                <span>({places.length} found)</span>
                              )}:
                            </h4>
                            {/* Search filter for places */}
                            <Input 
                              placeholder="Filter places..."
                              className="mb-3"
                              value={placeSearchTerm}
                              onChange={(e) => {
                                const searchText = e.target.value.toLowerCase();
                                setPlaceSearchTerm(searchText);
                                
                                if (searchText.trim() === '') {
                                  setFilteredPlaces(places);
                                  return;
                                }
                                
                                const filtered = places.filter(place => 
                                  place.name.toLowerCase().includes(searchText) || 
                                  (place.address && place.address.toLowerCase().includes(searchText)) ||
                                  (place.category && place.category.toLowerCase().includes(searchText))
                                );
                                
                                setFilteredPlaces(filtered);
                                
                                if (filtered.length === 0) {
                                  toast({
                                    title: "No matches",
                                    description: "No places match your search. Try something else.",
                                    duration: 2000
                                  });
                                }
                              }}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                              {(placeSearchTerm ? filteredPlaces : places).map((place) => (
                                <Button
                                  key={place.id}
                                  type="button"
                                  variant="outline"
                                  className="flex items-start justify-start h-auto py-2 px-3 text-left"
                                  onClick={() => {
                                    setLocation(`${place.name} - ${place.address}`);
                                    setCustomLocation(false);
                                    toast({
                                      title: "Location selected",
                                      description: `Selected ${place.name}`,
                                      duration: 1500
                                    });
                                  }}
                                >
                                  <div>
                                    <p className="font-medium">{place.name}</p>
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
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Search and select real venues in {city} using Google Places
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="suggestions" className="pt-4">
                      {/* Featured Venue - Jagadamba Theatre */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Featured Venue:</h4>
                        <Button
                          key="featured-jagadamba"
                          type="button"
                          variant="default"
                          className="flex items-start justify-start h-auto py-3 px-4 text-left w-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                          onClick={() => {
                            const jagadamba = venueSuggestions.find(v => v.id === "1");
                            if (jagadamba) {
                              setLocation(`${jagadamba.name} - ${jagadamba.address}`);
                              setSelectedVenue(jagadamba.id);
                              setCustomLocation(false);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <Ticket className="h-6 w-6 text-amber-700" />
                            <div>
                              <p className="font-medium text-base">Jagadamba Theatre</p>
                              <p className="text-sm text-amber-800">Jagadamba Junction, Visakhapatnam</p>
                            </div>
                          </div>
                        </Button>
                      </div>
                      
                      <h4 className="text-sm font-medium mb-2">Other Popular Venues:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {venueSuggestions.slice(1, 8).map((venue) => (
                          <Button
                            key={venue.id}
                            type="button"
                            variant="outline"
                            className="flex items-start justify-start h-auto py-2 px-3 text-left"
                            onClick={() => {
                              setLocation(`${venue.name} - ${venue.address}`);
                              setSelectedVenue(venue.id);
                              setCustomLocation(false);
                            }}
                          >
                            <div>
                              <p className="font-medium">{venue.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{venue.address}</p>
                            </div>
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Pick from our curated list of popular venues
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="custom" className="pt-4">
                      <Input
                        value={location}
                        onChange={(e) => handleLocationInput(e.target.value)}
                        placeholder="Enter a specific venue or address"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Type a custom location or venue that's not listed
                      </p>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="p-6 bg-muted/50 rounded-md flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="font-medium">Please select a city first</p>
                  <p className="text-xs text-muted-foreground mt-1">Venue options will be available after selecting a city</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Fourth row: Date, Time, and Participant Limit in a three-column layout */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={(day) => day && setDate(day)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select
                value={time || ""}
                onValueChange={(value) => setTime(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Common Times</SelectLabel>
                    {commonTimeOptions.map((timeOption) => (
                      <SelectItem key={timeOption.value} value={timeOption.value}>
                        {timeOption.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Enter custom time</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              {time === "custom" && (
                <div className="relative mt-2">
                  <Input
                    id="customTime"
                    placeholder="e.g., 7:00 PM"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="pl-10"
                  />
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="participantLimit">Participant Limit</Label>
              <Input
                id="participantLimit"
                type="number"
                min="0"
                placeholder="Leave empty for no limit"
                value={participantLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setParticipantLimit('');
                  } else {
                    const numValue = parseInt(value);
                    if (numValue >= 0) {
                      setParticipantLimit(numValue);
                    }
                  }
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Leave empty for no limit</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createZoneMutation.isPending}
              className="bg-primary text-white"
            >
              {createZoneMutation.isPending ? 'Creating...' : 'Create Zone'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateZoneModal;