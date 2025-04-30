import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

interface CityOption {
  value: string;
  label: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCitySelect?: (value: string, label: string) => void;
  placeholder?: string;
  className?: string;
  cities: CityOption[];
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  onCitySelect,
  placeholder = "Enter a city",
  className,
  cities
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<CityOption[]>([]);
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
  
  // Filter cities based on input
  useEffect(() => {
    // When input is empty or very short, show popular cities
    if (value.length < 2) {
      // Just show a selection of major global cities when no search term
      const popularCities = cities.filter(city => 
        ["new york", "london", "tokyo", "paris", "sydney", "beijing", 
         "delhi", "mumbai", "rio de janeiro", "cairo", "toronto", 
         "berlin", "mexico city", "visakhapatnam"].some(popular => 
          city.label.toLowerCase().includes(popular)
        )
      );
      setFilteredCities(popularCities.slice(0, 10));
      return;
    }
    
    const searchTerm = value.toLowerCase();
    
    const filtered = cities.filter(city => 
      city.label.toLowerCase().includes(searchTerm) || 
      city.value.includes(searchTerm)
    );
    
    // Limit results to prevent overwhelming the user
    setFilteredCities(filtered.slice(0, 10));
  }, [value, cities]);
  
  // Handle selection of a suggestion
  const handleSuggestionClick = (city: CityOption) => {
    onChange(city.value);
    if (onCitySelect) {
      onCitySelect(city.value, city.label);
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
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>
      
      {showSuggestions && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCities.map((city) => (
            <div
              key={city.value}
              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSuggestionClick(city)}
            >
              {/* Extract city name and country parts for better display */}
              {city.label.includes(',') ? (
                <>
                  <div className="font-medium text-base">
                    {city.label.split(',')[0]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {city.label.split(',')[1].trim()}
                  </div>
                </>
              ) : (
                <div className="font-medium">{city.label}</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showSuggestions && filteredCities.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-2 text-center text-muted-foreground">
          {value.length > 0 ? "No matching cities found" : "Click to see popular cities"}
        </div>
      )}
    </div>
  );
};