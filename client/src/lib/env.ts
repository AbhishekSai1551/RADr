// Add global window interface to include our ENV property
declare global {
  interface Window {
    ENV?: {
      GOOGLE_MAPS_API_KEY: string;
    };
  }
}

// Expose server environment variables to client
// Add additional environment variables here as needed
export const env = {
  GOOGLE_MAPS_API_KEY: window.ENV?.GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
};

// Function to fetch Google Maps API key from server
export async function fetchGoogleMapsApiKey(): Promise<string> {
  try {
    // If key already exists in window.ENV, use that
    if (window.ENV?.GOOGLE_MAPS_API_KEY) {
      return window.ENV.GOOGLE_MAPS_API_KEY;
    }
    
    // Otherwise fetch from server
    const response = await fetch('/api/google-maps-key');
    const data = await response.json();
    
    // Store key in window.ENV for future use
    if (data.key) {
      if (!window.ENV) window.ENV = { GOOGLE_MAPS_API_KEY: data.key };
      else window.ENV.GOOGLE_MAPS_API_KEY = data.key;
    }
    
    return data.key || '';
  } catch (error) {
    console.error('Error fetching Google Maps API key:', error);
    return '';
  }
}