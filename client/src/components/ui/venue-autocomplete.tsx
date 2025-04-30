import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { MapPin } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  address: string;
}

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onVenueSelect?: (venue: Venue) => void;
  placeholder?: string;
  className?: string;
  venues: Venue[];
}

export const VenueAutocomplete: React.FC<VenueAutocompleteProps> = ({
  value,
  onChange,
  onVenueSelect,
  placeholder = "Enter a venue",
  className,
  venues
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Filter venues based on input
  useEffect(() => {
    // Show all venues when the input is empty or very short
    if (value.length < 2) {
      setFilteredVenues(venues.slice(0, 10));
      return;
    }
    
    const searchTerm = value.toLowerCase();
    
    const filtered = venues.filter(venue => 
      venue.name.toLowerCase().includes(searchTerm) || 
      venue.address.toLowerCase().includes(searchTerm)
    );
    
    // Limit results to prevent overwhelming the user
    setFilteredVenues(filtered.slice(0, 10));
  }, [value, venues]);
  
  // Handle selection of a suggestion
  const handleSuggestionClick = (venue: Venue) => {
    const venueFullName = `${venue.name} - ${venue.address}`;
    onChange(venueFullName);
    if (onVenueSelect) {
      onVenueSelect(venue);
    }
    setShowSuggestions(false);
  };
  
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value.length > 0) {
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
            }
          }}
          placeholder={placeholder}
          className={`pl-10 ${className || ''}`}
          onFocus={() => setShowSuggestions(true)}
        />
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>
      
      {showSuggestions && filteredVenues.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredVenues.map((venue) => (
            <div
              key={venue.id}
              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSuggestionClick(venue)}
            >
              <div className="font-medium">{venue.name}</div>
              <div className="text-sm text-muted-foreground">{venue.address}</div>
            </div>
          ))}
        </div>
      )}
      
      {showSuggestions && filteredVenues.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-2 text-center text-muted-foreground">
          {value.length > 0 ? "No matching venues found" : "Click to see venue suggestions"}
        </div>
      )}
    </div>
  );
};