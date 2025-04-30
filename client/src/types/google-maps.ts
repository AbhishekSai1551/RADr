// Simplified environment information only

declare global {
  interface Window {
    ENV?: {
      GOOGLE_MAPS_API_KEY: string;
    };
    
    // Simple flag to check if Google Maps is loaded
    googleMapsLoaded?: boolean;
  }
}

export {};