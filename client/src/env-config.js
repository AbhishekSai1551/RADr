// Export environment variables for client-side use
window.ENV = {
  // Use VITE_* prefix for client-side environment variables
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
};