// Cheese-themed colors for background
import { useState, useEffect } from 'react';

// Define cheese-themed color palette
const CHEESE_COLORS = {
  // Lighter yellow at the top to slightly darker at bottom (Swiss cheese inspired)
  light: { r: 255, g: 225, b: 70 },   // Vibrant Swiss cheese yellow
  medium: { r: 255, g: 210, b: 45 },  // Rich cheddar yellow
  dark: { r: 250, g: 190, b: 20 }     // Deep golden cheese yellow
};

// Interpolate between two colors
function interpolateColor(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }, factor: number) {
  return {
    r: Math.round(color1.r + factor * (color2.r - color1.r)),
    g: Math.round(color1.g + factor * (color2.g - color1.g)),
    b: Math.round(color1.b + factor * (color2.b - color1.b))
  };
}

// Get the cheese gradient colors
export function getCheeseGradient() {
  // Create random subtle variations in the cheese color for a more organic look
  const randomFactor = Math.random() * 0.1; // Small random factor for subtle variations
  
  const topColor = {
    r: CHEESE_COLORS.light.r,
    g: CHEESE_COLORS.light.g,
    b: CHEESE_COLORS.light.b
  };
  
  // Interpolate between medium and dark for bottom color with slight randomness
  const bottomColor = interpolateColor(
    CHEESE_COLORS.medium,
    CHEESE_COLORS.dark,
    0.5 + randomFactor
  );
  
  // Create spots/holes effect on the base color for Swiss cheese look
  const baseColor = interpolateColor(topColor, bottomColor, 0.5);
  
  return {
    top: `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`,
    bottom: `rgb(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`,
    base: `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`
  };
}

// A React hook that updates the cheese background color
export function useCheeseColor(intervalInMs = 120000) { // Update every 2 minutes by default
  const [cheeseColors, setCheeseColors] = useState(getCheeseGradient());
  
  useEffect(() => {
    // Update immediately
    setCheeseColors(getCheeseGradient());
    
    // Then update periodically for subtle variations
    const interval = setInterval(() => {
      setCheeseColors(getCheeseGradient());
    }, intervalInMs);
    
    return () => clearInterval(interval);
  }, [intervalInMs]);
  
  return cheeseColors;
}