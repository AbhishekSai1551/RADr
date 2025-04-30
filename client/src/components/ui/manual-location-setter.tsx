import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronsUpDown, Loader2, MapPin, Search } from 'lucide-react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Comprehensive list of cities with lat/lng coordinates
const worldCities = [
  { name: 'Aarhus', lat: 56.1572, lng: 10.2107, country: "Denmark" },
  { name: 'Addis Ababa', lat: 9.0320, lng: 38.7498, country: "Ethiopia" },
  { name: 'Adelaide', lat: -34.9285, lng: 138.6007, country: "Australia" },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: "Netherlands" },
  { name: 'Anchorage', lat: 61.2181, lng: -149.9003, country: "USA" },
  { name: 'Athens', lat: 37.9838, lng: 23.7275, country: "Greece" },
  { name: 'Auckland', lat: -36.8483, lng: 174.7625, country: "New Zealand" },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, country: "Thailand" },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734, country: "Spain" },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, country: "China" },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: "Germany" },
  { name: 'Boston', lat: 42.3601, lng: -71.0589, country: "USA" },
  { name: 'Brussels', lat: 50.8503, lng: 4.3517, country: "Belgium" },
  { name: 'Budapest', lat: 47.4979, lng: 19.0402, country: "Hungary" },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, country: "Argentina" },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, country: "Egypt" },
  { name: 'Calgary', lat: 51.0447, lng: -114.0719, country: "Canada" },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, country: "South Africa" },
  { name: 'Casablanca', lat: 33.5889, lng: -7.6173, country: "Morocco" },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, country: "USA" },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, country: "Denmark" },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970, country: "USA" },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, country: "India" },
  { name: 'Denver', lat: 39.7392, lng: -104.9903, country: "USA" },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, country: "UAE" },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603, country: "Ireland" },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, country: "UK" },
  { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, country: "Germany" },
  { name: 'Geneva', lat: 46.2044, lng: 6.1432, country: "Switzerland" },
  { name: 'Hamburg', lat: 53.5511, lng: 9.9937, country: "Germany" },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384, country: "Finland" },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, country: "China" },
  { name: 'Houston', lat: 29.7604, lng: -95.3698, country: "USA" },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, country: "India" },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, country: "Turkey" },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, country: "Indonesia" },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, country: "South Africa" },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011, country: "Pakistan" },
  { name: 'Kiev', lat: 50.4501, lng: 30.5234, country: "Ukraine" },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, country: "India" },
  { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, country: "Malaysia" },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, country: "Nigeria" },
  { name: 'Las Vegas', lat: 36.1699, lng: -115.1398, country: "USA" },
  { name: 'Lima', lat: -12.0464, lng: -77.0428, country: "Peru" },
  { name: 'Lisbon', lat: 38.7223, lng: -9.1393, country: "Portugal" },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: "UK" },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, country: "USA" },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, country: "Spain" },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, country: "Philippines" },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, country: "Australia" },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, country: "Mexico" },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, country: "USA" },
  { name: 'Milan', lat: 45.4642, lng: 9.1900, country: "Italy" },
  { name: 'Montreal', lat: 45.5017, lng: -73.5673, country: "Canada" },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, country: "Russia" },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: "India" },
  { name: 'Munich', lat: 48.1351, lng: 11.5820, country: "Germany" },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, country: "Kenya" },
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, country: "India" },
  { name: 'New York', lat: 40.7128, lng: -74.0060, country: "USA" },
  { name: 'Osaka', lat: 34.6937, lng: 135.5022, country: "Japan" },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522, country: "Norway" },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: "France" },
  { name: 'Perth', lat: -31.9505, lng: 115.8605, country: "Australia" },
  { name: 'Phoenix', lat: 33.4484, lng: -112.0740, country: "USA" },
  { name: 'Prague', lat: 50.0755, lng: 14.4378, country: "Czech Republic" },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, country: "Brazil" },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, country: "Italy" },
  { name: 'Saint Petersburg', lat: 59.9343, lng: 30.3351, country: "Russia" },
  { name: 'San Diego', lat: 32.7157, lng: -117.1611, country: "USA" },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: "USA" },
  { name: 'Santiago', lat: -33.4489, lng: -70.6693, country: "Chile" },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, country: "Brazil" },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, country: "USA" },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, country: "South Korea" },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, country: "China" },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: "Singapore" },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, country: "Sweden" },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: "Australia" },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, country: "Brazil" },
  { name: 'Taipei', lat: 25.0330, lng: 121.5654, country: "Taiwan" },
  { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, country: "Israel" },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: "Japan" },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: "Canada" },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207, country: "Canada" },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738, country: "Austria" },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, country: "India" },
  { name: 'Warsaw', lat: 52.2297, lng: 21.0122, country: "Poland" },
  { name: 'Washington DC', lat: 38.9072, lng: -77.0369, country: "USA" },
  { name: 'Zürich', lat: 47.3769, lng: 8.5417, country: "Switzerland" },
];

// Top 10 popular cities for quick selection
const popularLocations = [
  { name: 'New York', lat: 40.7128, lng: -74.0060, country: "USA" },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: "UK" },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: "Japan" },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: "France" },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: "Singapore" },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: "India" },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: "Australia" },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, country: "UAE" },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: "USA" },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, country: "India" },
];

export default function ManualLocationSetter() {
  const [open, setOpen] = useState(false);
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [citySearchValue, setCitySearchValue] = useState("");
  const [selectedCity, setSelectedCity] = useState<typeof worldCities[0] | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredCities, setFilteredCities] = useState(worldCities);
  const { toast } = useToast();
  
  // Filter cities based on search input
  const filterCities = (value: string) => {
    setCitySearchValue(value);
    const filtered = worldCities.filter(city => 
      city.name.toLowerCase().includes(value.toLowerCase()) ||
      city.country.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!latitude || !longitude) {
      toast({
        title: "Both latitude and longitude are required",
        variant: "destructive"
      });
      return;
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid numeric values for latitude and longitude",
        variant: "destructive"
      });
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid coordinates range",
        description: "Latitude must be between -90 and 90, and longitude between -180 and 180",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update the user's location with the provided coordinates
      await apiRequest('PATCH', `/api/user/1/location`, {
        latitude: lat,
        longitude: lng,
      });
      
      toast({
        title: "Location updated successfully!",
        description: `Your location is now set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
      
      // Refresh the page to apply the new location
      window.location.reload();
    } catch (error) {
      toast({
        title: "Failed to update location",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };
  
  const selectCity = async (city: typeof worldCities[0]) => {
    setSelectedCity(city);
    setLatitude(city.lat.toString());
    setLongitude(city.lng.toString());
    setCitySearchOpen(false);
    
    setIsLoading(true);
    
    try {
      // Update the user's location with the selected city's coordinates
      await apiRequest('PATCH', `/api/user/1/location`, {
        latitude: city.lat,
        longitude: city.lng,
      });
      
      toast({
        title: "Location updated successfully!",
        description: `Your location has been set to ${city.name}, ${city.country}. Refreshing...`,
      });
      
      // Refresh the page to apply the new location
      window.location.reload();
    } catch (error) {
      toast({
        title: "Failed to update location",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          Set Test Location
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Your Test Location</DialogTitle>
          <DialogDescription>
            Set a test location to use instead of browser geolocation.
            Choose a city or enter precise coordinates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Searchable City Dropdown */}
          <div className="space-y-2">
            <Label>Search Cities</Label>
            <Popover open={citySearchOpen} onOpenChange={setCitySearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={citySearchOpen}
                  className="w-full justify-between"
                >
                  {selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : "Search for a city..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search city or country..." 
                    value={citySearchValue} 
                    onValueChange={filterCities}
                  />
                  <CommandList>
                    <CommandEmpty>No cities found.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <CommandItem
                          key={`${city.name}-${city.country}`}
                          onSelect={() => selectCity(city)}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium">{city.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">{city.country}</span>
                          </div>
                          {selectedCity?.name === city.name && (
                            <Check className="h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="my-4 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Popular Cities
              </span>
            </div>
          </div>
          
          {/* Popular Cities Grid */}
          <div className="grid grid-cols-2 gap-2">
            {popularLocations.map((location) => (
              <Card 
                key={location.name} 
                className="cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => selectCity(location)}
              >
                <CardContent className="p-3">
                  <div className="text-sm font-medium">{location.name}</div>
                  <div className="text-xs text-muted-foreground">{location.country}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="my-4 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter precise coordinates
              </span>
            </div>
          </div>
          
          {/* Manual Coordinate Entry */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="e.g., 40.7128"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="e.g., -74.006"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting location...
                  </>
                ) : (
                  "Set Location"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}