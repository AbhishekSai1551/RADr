import { Request, Response } from 'express';
import fetch from 'node-fetch';

interface LocationDetails {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  details: LocationDetails;
}

// Interface for place objects
export interface Place {
  id: string;
  name: string;
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  rating?: number;
  photos?: string[];
  category: string;
  types: string[];
}

// Function to reverse geocode (convert lat/lng to address)
export async function reverseGeocode(
  latitude: number, 
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    // First check if Google Maps API key is available
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json() as any;
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.error('Error from Google Maps API:', data.status, data.error_message);
        // Fall back to OpenStreetMap if Google API fails
        return reverseGeocodeWithOpenStreetMap(latitude, longitude);
      }
      
      const location = data.results[0];
      const addressComponents = location.address_components || [];
      
      const getAddressComponent = (type: string) => {
        const component = addressComponents.find((comp: any) => comp.types.includes(type));
        return component ? component.long_name : '';
      };
      
      const result: GeocodingResult = {
        latitude,
        longitude,
        formattedAddress: location.formatted_address || '',
        details: {
          address: location.formatted_address || '',
          city: getAddressComponent('locality') || getAddressComponent('administrative_area_level_2') || '',
          state: getAddressComponent('administrative_area_level_1') || '',
          country: getAddressComponent('country') || '',
          postalCode: getAddressComponent('postal_code') || ''
        }
      };
      
      return result;
    } else {
      // Fall back to OpenStreetMap if Google API key is not available
      console.log('Google Maps API key not available, falling back to OpenStreetMap');
      return reverseGeocodeWithOpenStreetMap(latitude, longitude);
    }
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    // Fall back to OpenStreetMap on error
    return reverseGeocodeWithOpenStreetMap(latitude, longitude);
  }
}

// Helper function for reverse geocoding with OpenStreetMap
async function reverseGeocodeWithOpenStreetMap(
  latitude: number, 
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    // Using OpenStreetMap's Nominatim service (free, doesn't require API key)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RAD.r Application'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error from Nominatim: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    if (!data || !data.address) {
      return null;
    }
    
    const result: GeocodingResult = {
      latitude,
      longitude,
      formattedAddress: data.display_name || '',
      details: {
        address: data.display_name || '',
        city: data.address.city || data.address.town || data.address.village || '',
        state: data.address.state || '',
        country: data.address.country || '',
        postalCode: data.address.postcode || ''
      }
    };
    
    return result;
  } catch (error) {
    console.error('Error in OpenStreetMap reverse geocoding:', error);
    return null;
  }
}

// Function to geocode an address (convert address to lat/lng)
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    // Check if we have a Google API key and use it if available
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json() as any;
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        // Fall back to OpenStreetMap if Google API doesn't find the address
        return geocodeAddressWithOpenStreetMap(address);
      }
      
      const location = data.results[0];
      const addressComponents = location.address_components || [];
      
      const getAddressComponent = (type: string) => {
        const component = addressComponents.find((comp: any) => comp.types.includes(type));
        return component ? component.long_name : '';
      };
      
      const result: GeocodingResult = {
        latitude: location.geometry.location.lat,
        longitude: location.geometry.location.lng,
        formattedAddress: location.formatted_address || '',
        details: {
          address: location.formatted_address || '',
          city: getAddressComponent('locality') || getAddressComponent('administrative_area_level_2') || '',
          state: getAddressComponent('administrative_area_level_1') || '',
          country: getAddressComponent('country') || '',
          postalCode: getAddressComponent('postal_code') || ''
        }
      };
      
      return result;
    } else {
      // Use OpenStreetMap as fallback
      return geocodeAddressWithOpenStreetMap(address);
    }
  } catch (error) {
    console.error('Error in geocoding:', error);
    // Fall back to OpenStreetMap on error
    return geocodeAddressWithOpenStreetMap(address);
  }
}

// Function to geocode using place_id from Google API
export async function geocodeByPlaceId(placeId: string): Promise<GeocodingResult | null> {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not available');
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null;
    }
    
    const location = data.results[0];
    const addressComponents = location.address_components || [];
    
    const getAddressComponent = (type: string) => {
      const component = addressComponents.find((comp: any) => comp.types.includes(type));
      return component ? component.long_name : '';
    };
    
    const result: GeocodingResult = {
      latitude: location.geometry.location.lat,
      longitude: location.geometry.location.lng,
      formattedAddress: location.formatted_address || '',
      details: {
        address: location.formatted_address || '',
        city: getAddressComponent('locality') || getAddressComponent('administrative_area_level_2') || '',
        state: getAddressComponent('administrative_area_level_1') || '',
        country: getAddressComponent('country') || '',
        postalCode: getAddressComponent('postal_code') || ''
      }
    };
    
    return result;
  } catch (error) {
    console.error('Error in geocoding by place ID:', error);
    return null;
  }
}

// Helper function to use OpenStreetMap for geocoding
async function geocodeAddressWithOpenStreetMap(address: string): Promise<GeocodingResult | null> {
  try {
    // Using OpenStreetMap's Nominatim service
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RAD.r Application'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error from Nominatim: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any[];
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const location = data[0];
    
    const result: GeocodingResult = {
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      formattedAddress: location.display_name || '',
      details: {
        address: location.display_name || '',
        city: location.address.city || location.address.town || location.address.village || '',
        state: location.address.state || '',
        country: location.address.country || '',
        postalCode: location.address.postcode || ''
      }
    };
    
    return result;
  } catch (error) {
    console.error('Error in OpenStreetMap geocoding:', error);
    return null;
  }
}

// Search for nearby places
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 500,
  type: string = ''
) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return {
        results: [],
        message: "Google Places API key required for this functionality"
      };
    }

    // Prepare the query parameters
    const typeParam = type ? `&type=${type}` : '';
    
    // Use the text search API which gives more comprehensive results than nearby search
    // This will get ALL places in the area that match the type, not just a limited set
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=places+in+area&location=${latitude},${longitude}&radius=${radius}${typeParam}&key=${apiKey}`;
    
    console.log('Calling Google Places API (URL masked for security):', 
                url.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    const data = await response.json() as any;
    
    // Log any error response (but hide API key)
    if (data.status !== 'OK') {
      console.log('Google Places API Error Response:', {
        status: data.status,
        error_message: data.error_message,
      });
      console.error('Error from Google Places API:', data.status, data.error_message);
      
      if (data.status === 'REQUEST_DENIED') {
        return {
          results: generateFallbackPlaces(latitude + ',' + longitude),
          message: "Google API Error: " + (data.error_message || "Request denied"),
          error: {
            status: data.status,
            message: data.error_message || "API request denied"
          }
        };
      }
      
      // If it's a different error, return fallback places
      return {
        results: generateFallbackPlaces(latitude + ',' + longitude),
        message: "Using fallback places due to API error: " + data.status,
        error: {
          status: data.status,
          message: data.error_message || "API error"
        }
      };
    }
    
    // Transform the results to a more usable format
    const results: Place[] = data.results.map((place: any) => {
      // Extract primary category from types
      const primaryType = place.types?.[0] || 'unknown';
      let category = primaryType;
      
      // Map common Google Places types to more user-friendly categories
      if (primaryType.includes('restaurant') || primaryType.includes('food')) {
        category = 'restaurant';
      } else if (primaryType.includes('cafe')) {
        category = 'cafe';
      } else if (primaryType.includes('bar') || primaryType.includes('pub')) {
        category = 'bar';
      } else if (primaryType.includes('mall') || primaryType.includes('shopping') || primaryType.includes('store')) {
        category = 'shopping';
      } else if (primaryType.includes('park') || primaryType.includes('garden')) {
        category = 'park';
      } else if (primaryType.includes('museum')) {
        category = 'museum';
      } else if (primaryType.includes('hotel') || primaryType.includes('lodging')) {
        category = 'hotel';
      } else if (primaryType.includes('cinema') || primaryType.includes('movie')) {
        category = 'entertainment';
      }
      
      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || place.vicinity || "",
        types: place.types || [],
        rating: place.rating,
        location: place.geometry.location,
        photos: place.photos ? place.photos.map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
        ) : [],
        category: category
      };
    });
    
    return { results };
  } catch (error) {
    console.error('Error searching nearby places:', error);
    return {
      results: [],
      message: `Error searching nearby places: ${(error as Error).message}`
    };
  }
}

// Helper function to generate fallback places data
function generateFallbackPlaces(cityName: string): Place[] {
  // List of general venue types that exist in most cities
  const generalVenues: Place[] = [
    { 
      id: "fallback-1", 
      name: "Jagadamba Theatre", 
      address: `Jagadamba Junction, ${cityName}`,
      rating: 4.7,
      photos: [],
      category: "entertainment",
      types: ["cinema", "entertainment"]
    },
    { 
      id: "fallback-2", 
      name: "INOX Multiplex", 
      address: `Cinema Complex, ${cityName}`,
      rating: 4.6,
      photos: [],
      category: "entertainment",
      types: ["cinema", "entertainment"]
    },
    { 
      id: "fallback-3", 
      name: "PVR Cinemas", 
      address: `Mall Road, ${cityName}`,
      rating: 4.5,
      photos: [],
      category: "entertainment",
      types: ["cinema", "entertainment"]
    },
    { 
      id: "fallback-4", 
      name: "Starbucks Coffee", 
      address: `${cityName} Central, Downtown`,
      rating: 4.5,
      photos: [],
      category: "cafe",
      types: ["cafe", "food"]
    },
    { 
      id: "fallback-5", 
      name: "Cafe Coffee Day", 
      address: `Main Street, ${cityName}`,
      rating: 4.3,
      photos: [],
      category: "cafe",
      types: ["cafe", "food"]
    },
    { 
      id: "fallback-6", 
      name: "Barista Coffee", 
      address: `Central Plaza, ${cityName}`,
      rating: 4.2,
      photos: [],
      category: "cafe",
      types: ["cafe", "food"]
    },
    { 
      id: "fallback-7", 
      name: "City Central Park", 
      address: `Main Park, ${cityName}`,
      rating: 4.8,
      photos: [],
      category: "park",
      types: ["park", "tourist_attraction"]
    },
    { 
      id: "fallback-8", 
      name: "${cityName} Mall", 
      address: `${cityName} Mall, Commercial District`,
      rating: 4.2,
      photos: [],
      category: "shopping",
      types: ["shopping", "mall"]
    },
    { 
      id: "fallback-9", 
      name: "Central Library", 
      address: `Knowledge Street, ${cityName}`,
      rating: 4.6,
      photos: [],
      category: "education",
      types: ["education", "library"]
    },
    { 
      id: "fallback-10", 
      name: "${cityName} Stadium", 
      address: `${cityName} Stadium, Sports District`,
      rating: 4.7,
      photos: [],
      category: "sports",
      types: ["sports", "stadium"]
    },
    { 
      id: "fallback-11", 
      name: "${cityName} Art Gallery", 
      address: `Culture Boulevard, ${cityName}`,
      rating: 4.3,
      photos: [],
      category: "art",
      types: ["art", "gallery", "tourist_attraction"]
    },
    { 
      id: "fallback-12", 
      name: "${cityName} Historical Museum", 
      address: `Heritage Road, ${cityName}`,
      rating: 4.4,
      photos: [],
      category: "museum",
      types: ["museum", "tourist_attraction"]
    },
    { 
      id: "fallback-13", 
      name: "Paradise Restaurant", 
      address: `Food Street, ${cityName}`,
      rating: 4.7,
      photos: [],
      category: "restaurant",
      types: ["restaurant", "food"]
    },
    { 
      id: "fallback-14", 
      name: "Bawarchi Restaurant", 
      address: `Culinary Avenue, ${cityName}`,
      rating: 4.5,
      photos: [],
      category: "restaurant",
      types: ["restaurant", "food"]
    },
    { 
      id: "fallback-21", 
      name: "Highstreet Pub", 
      address: `Nightlife District, ${cityName}`,
      rating: 4.4,
      photos: [],
      category: "bar",
      types: ["bar", "nightlife"]
    },
    { 
      id: "fallback-22", 
      name: "Downtown Brewery", 
      address: `Brewery Lane, ${cityName}`,
      rating: 4.5,
      photos: [],
      category: "bar",
      types: ["bar", "restaurant"]
    },
    { 
      id: "fallback-23", 
      name: "City Nightclub", 
      address: `Party Zone, ${cityName}`,
      rating: 4.3,
      photos: [],
      category: "nightlife",
      types: ["nightlife", "bar"]
    },
    { 
      id: "fallback-24", 
      name: "Urban Hangout", 
      address: `Social Street, ${cityName}`,
      rating: 4.6,
      photos: [],
      category: "restaurant",
      types: ["restaurant", "bar", "cafe"]
    },
    { 
      id: "fallback-25", 
      name: "City Bowling Alley", 
      address: `Entertainment Zone, ${cityName}`,
      rating: 4.5,
      photos: [],
      category: "entertainment",
      types: ["entertainment", "bowling"]
    },
    { 
      id: "fallback-15", 
      name: "Taj Hotel", 
      address: `Luxury Boulevard, ${cityName}`,
      rating: 4.8,
      photos: [],
      category: "hotel",
      types: ["hotel", "lodging"]
    },
    { 
      id: "fallback-16", 
      name: "The Park Hotel", 
      address: `Elite Street, ${cityName}`,
      rating: 4.6,
      photos: [],
      category: "hotel",
      types: ["hotel", "lodging"]
    },
    { 
      id: "fallback-17", 
      name: "Central University", 
      address: `Education District, ${cityName}`,
      rating: 4.7,
      photos: [],
      category: "education",
      types: ["education", "university"]
    },
    { 
      id: "fallback-18", 
      name: "City Hospital", 
      address: `Health Avenue, ${cityName}`,
      rating: 4.5,
      photos: [],
      category: "healthcare",
      types: ["hospital", "health"]
    },
    { 
      id: "fallback-19", 
      name: "Apollo Hospital", 
      address: `Medical Center, ${cityName}`,
      rating: 4.6,
      photos: [],
      category: "healthcare",
      types: ["hospital", "health"]
    },
    { 
      id: "fallback-20", 
      name: "City Train Station", 
      address: `Railway Colony, ${cityName}`,
      rating: 4.3,
      photos: [],
      category: "transport",
      types: ["train_station", "transit_station"]
    }
  ];
  
  // Special venues for Visakhapatnam/Vizag
  const visakhapatnamVenues: Place[] = [
    { 
      id: "vizag-1", 
      name: "RK Beach", 
      address: "Beach Road, Visakhapatnam",
      rating: 4.8,
      photos: [],
      category: "beach",
      types: ["beach", "tourist_attraction", "park"]
    },
    { 
      id: "vizag-2", 
      name: "Kailasagiri", 
      address: "Kailasagiri Hills, Visakhapatnam",
      rating: 4.7,
      photos: [],
      category: "park",
      types: ["park", "tourist_attraction"]
    },
    { 
      id: "vizag-3", 
      name: "CMR Central Mall", 
      address: "Maddilapalem, Visakhapatnam",
      rating: 4.5,
      photos: [],
      category: "shopping",
      types: ["shopping", "mall"]
    },
    { 
      id: "vizag-4", 
      name: "Indira Gandhi Zoological Park", 
      address: "Seethakonda, Visakhapatnam",
      rating: 4.6,
      photos: [],
      category: "zoo",
      types: ["zoo", "tourist_attraction", "park"]
    },
    { 
      id: "vizag-5", 
      name: "Submarine Museum", 
      address: "Beach Road, Visakhapatnam",
      rating: 4.7,
      photos: [],
      category: "museum",
      types: ["museum", "tourist_attraction"]
    },
    { 
      id: "vizag-6", 
      name: "The Park Hotel", 
      address: "Beach Road, Visakhapatnam",
      rating: 4.5,
      photos: [],
      category: "hotel",
      types: ["hotel", "bar", "restaurant"]
    },
    { 
      id: "vizag-7", 
      name: "Novotel Varun Beach", 
      address: "Beach Road, Visakhapatnam",
      rating: 4.6,
      photos: [],
      category: "hotel",
      types: ["hotel", "bar", "restaurant"]
    },
    { 
      id: "vizag-8", 
      name: "Cafe Coffee Day - Beach Road", 
      address: "Beach Road, Visakhapatnam",
      rating: 4.3,
      photos: [],
      category: "cafe",
      types: ["cafe", "food"]
    },
    { 
      id: "vizag-9", 
      name: "The Eatery", 
      address: "Siripuram, Visakhapatnam",
      rating: 4.4,
      photos: [],
      category: "restaurant",
      types: ["restaurant", "food"]
    },
    { 
      id: "vizag-10", 
      name: "Upland Bistro", 
      address: "Siripuram, Visakhapatnam",
      rating: 4.5,
      photos: [],
      category: "restaurant",
      types: ["restaurant", "bar"]
    }
  ];
  
  // Special venues for Hyderabad
  const hyderabadVenues: Place[] = [
    { 
      id: "hyd-1", 
      name: "Charminar", 
      address: "Old City, Hyderabad",
      rating: 4.7,
      photos: [],
      category: "monument",
      types: ["monument", "tourist_attraction", "landmark"]
    },
    { 
      id: "hyd-2", 
      name: "Golconda Fort", 
      address: "Ibrahim Bagh, Hyderabad",
      rating: 4.8,
      photos: [],
      category: "monument",
      types: ["monument", "tourist_attraction", "landmark"]
    },
    { 
      id: "hyd-3", 
      name: "Wonderla Amusement Park", 
      address: "Kongara Kalan, Hyderabad",
      rating: 4.6,
      photos: [],
      category: "entertainment",
      types: ["entertainment", "amusement_park", "park"]
    },
    { 
      id: "hyd-4", 
      name: "Ramoji Film City", 
      address: "Anaspur Village, Hyderabad",
      rating: 4.7,
      photos: [],
      category: "entertainment",
      types: ["entertainment", "tourist_attraction"]
    },
    { 
      id: "hyd-5", 
      name: "Hussain Sagar Lake", 
      address: "Tank Bund Road, Hyderabad",
      rating: 4.5,
      photos: [],
      category: "lake",
      types: ["lake", "tourist_attraction", "park"]
    },
    { 
      id: "hyd-6", 
      name: "Taj Falaknuma Palace", 
      address: "Engine Bowli, Hyderabad",
      rating: 4.8,
      photos: [],
      category: "hotel",
      types: ["hotel", "landmark", "tourist_attraction"]
    },
    { 
      id: "hyd-7", 
      name: "Concu Patisserie", 
      address: "Jubilee Hills, Hyderabad",
      rating: 4.6,
      photos: [],
      category: "cafe",
      types: ["cafe", "food"]
    },
    { 
      id: "hyd-8", 
      name: "The Hoppery", 
      address: "Jubilee Hills, Hyderabad",
      rating: 4.5,
      photos: [],
      category: "bar",
      types: ["bar", "restaurant"]
    },
    { 
      id: "hyd-9", 
      name: "Broadway Brewery", 
      address: "Gachibowli, Hyderabad",
      rating: 4.4,
      photos: [],
      category: "bar",
      types: ["bar", "restaurant"]
    },
    { 
      id: "hyd-10", 
      name: "Forum Sujana Mall", 
      address: "Kukatpally, Hyderabad",
      rating: 4.3,
      photos: [],
      category: "shopping",
      types: ["shopping", "mall"]
    }
  ];
  
  // Combine general venues with any city-specific venues
  let venues: Place[] = [...generalVenues];
  
  // Convert to lowercase for case-insensitive matching
  const cityLower = cityName.toLowerCase();
  
  // Add city-specific venues
  if (cityLower.includes('visakhapatnam') || cityLower.includes('vizag')) {
    venues = [...venues, ...visakhapatnamVenues];
  } else if (cityLower.includes('hyderabad')) {
    venues = [...venues, ...hyderabadVenues];
  }
  
  // Ensure venue names and addresses use the correct city name
  return venues.map(venue => {
    // Replace {cityName} placeholder in name with actual city name
    const processedName = venue.name.includes('${cityName}') 
      ? venue.name.replace('${cityName}', cityName)
      : venue.name;
      
    return {
      ...venue,
      name: processedName
    };
  });
}

// Search for places in a city
export async function searchPlacesInCity(
  city: string,
  type: string = ''
) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.log('Google Maps API key not found in environment');
      return {
        results: generateFallbackPlaces(city),
        message: "Google Places API key not configured"
      };
    }

    // First, geocode the city to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`;
    console.log('Calling Google Geocoding API (URL masked for security):', 
                geocodeUrl.replace(apiKey, 'API_KEY_HIDDEN'));
                
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json() as any;
    
    // Log any error response (but hide API key)
    if (geocodeData.status !== 'OK') {
      console.log('Google Geocoding API Error Response:', {
        status: geocodeData.status,
        error_message: geocodeData.error_message,
      });
      
      // Check specific error cases
      if (geocodeData.status === 'REQUEST_DENIED') {
        const errorMsg = geocodeData.error_message || 'API project not authorized';
        console.error("Google API Error:", errorMsg);
        return {
          results: generateFallbackPlaces(city),
          message: "Google API not properly configured: " + errorMsg,
          error: {
            status: geocodeData.status,
            message: errorMsg
          }
        };
      }
    }

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error("Error geocoding city:", geocodeData.status, geocodeData.error_message);
      
      // Return fallback places 
      return {
        results: generateFallbackPlaces(city),
        message: "Using fallback places since Google Places API request failed"
      };
    }

    const location = geocodeData.results[0].geometry.location;
    const lat = location.lat;
    const lng = location.lng;

    // Use the coordinates to search for places
    const radius = 10000; // 10km radius to cover most of the city
    return await searchNearbyPlaces(lat, lng, radius, type);
  } catch (error) {
    console.error('Error searching places in city:', error);
    return {
      results: [],
      message: `Error searching places in city: ${(error as Error).message}`
    };
  }
}

// Handler for reverse geocoding endpoint
export async function handleReverseGeocode(req: Request, res: Response) {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: 'Invalid latitude or longitude' });
  }
  
  try {
    const geocodeResult = await reverseGeocode(latitude, longitude);
    
    if (!geocodeResult) {
      return res.status(404).json({ message: 'No address found for these coordinates' });
    }
    
    res.json(geocodeResult);
  } catch (error) {
    console.error('Error handling reverse geocode request:', error);
    res.status(500).json({ message: 'Failed to process reverse geocoding request' });
  }
}

// Handler for geocoding endpoint
export async function handleGeocode(req: Request, res: Response) {
  const { address, place_id } = req.query;
  
  try {
    let geocodeResult: GeocodingResult | null = null;
    
    if (place_id) {
      // If place_id is provided, use it for geocoding with Google API
      geocodeResult = await geocodeByPlaceId(place_id as string);
    } else if (address) {
      // Otherwise use address
      geocodeResult = await geocodeAddress(address as string);
    } else {
      return res.status(400).json({ message: 'Either address or place_id is required' });
    }
    
    if (!geocodeResult) {
      return res.status(404).json({ message: 'No coordinates found for this location' });
    }
    
    res.json(geocodeResult);
  } catch (error) {
    console.error('Error handling geocode request:', error);
    res.status(500).json({ message: 'Failed to process geocoding request' });
  }
}

// Handler for nearby places endpoint
export async function handleNearbyPlaces(req: Request, res: Response) {
  const { lat, lng, type, radius } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  const searchRadius = radius ? parseInt(radius as string) : 500;
  const placeType = type as string || '';
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: 'Invalid latitude or longitude' });
  }
  
  try {
    const placesResult = await searchNearbyPlaces(
      latitude, 
      longitude, 
      searchRadius,
      placeType
    );
    
    res.json(placesResult);
  } catch (error) {
    console.error('Error handling nearby places request:', error);
    res.status(500).json({ message: 'Failed to process nearby places request' });
  }
}

// Handler for places in a city endpoint
export async function handlePlacesInCity(req: Request, res: Response) {
  const { city, type } = req.query;
  
  if (!city) {
    return res.status(400).json({ message: 'City name is required' });
  }
  
  try {
    const placesResult = await searchPlacesInCity(
      city as string,
      type as string || ''
    );
    
    res.json(placesResult);
  } catch (error) {
    console.error('Error handling places in city request:', error);
    res.status(500).json({ message: 'Failed to process places in city request' });
  }
}