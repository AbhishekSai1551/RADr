import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { usePlacesAutocomplete, PlacePrediction } from '@/lib/location-service';
import { MapPin } from 'lucide-react';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (placeId: string, description: string) => void;
  placeholder?: string;
  className?: string;
}

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter a location",
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { predictions, loading, getPlaceDetails } = usePlacesAutocomplete(value);
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
  
  // Handle selection of a suggestion
  const handleSuggestionClick = async (prediction: PlacePrediction) => {
    onChange(prediction.description);
    setShowSuggestions(false);
    
    if (onPlaceSelect) {
      onPlaceSelect(prediction.place_id, prediction.description);
    }
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
          onFocus={() => value.length > 0 && setShowSuggestions(true)}
        />
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>
      
      {showSuggestions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSuggestionClick(prediction)}
            >
              <div className="font-medium">{prediction.structured_formatting.main_text}</div>
              <div className="text-sm text-muted-foreground">{prediction.structured_formatting.secondary_text}</div>
            </div>
          ))}
        </div>
      )}
      
      {showSuggestions && loading && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-2 text-center">
          Loading suggestions...
        </div>
      )}
    </div>
  );
};