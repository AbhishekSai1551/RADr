// Function to calculate sky color based on current time
import { useState, useEffect } from 'react';

// Define color palettes for different times of day
const SKY_COLORS = {
  night: {
    start: { r: 13, g: 19, b: 33 },    // Deep night blue
    end: { r: 25, g: 35, b: 60 }       // Pre-dawn blue
  },
  dawn: {
    start: { r: 25, g: 35, b: 60 },    // Pre-dawn blue
    end: { r: 240, g: 160, b: 120 }    // Sunrise orange-pink
  },
  morning: {
    start: { r: 240, g: 160, b: 120 }, // Sunrise orange-pink
    end: { r: 135, g: 206, b: 235 }    // Light blue
  },
  day: {
    start: { r: 135, g: 206, b: 235 }, // Light blue
    end: { r: 102, g: 178, b: 255 }    // Bright blue
  },
  afternoon: {
    start: { r: 102, g: 178, b: 255 }, // Bright blue
    end: { r: 70, g: 130, b: 180 }     // Steel blue
  },
  evening: {
    start: { r: 70, g: 130, b: 180 },  // Steel blue
    end: { r: 240, g: 160, b: 120 }    // Sunset orange-pink
  },
  dusk: {
    start: { r: 240, g: 160, b: 120 }, // Sunset orange-pink
    end: { r: 25, g: 35, b: 60 }       // Early night blue
  },
  late: {
    start: { r: 25, g: 35, b: 60 },    // Early night blue
    end: { r: 13, g: 19, b: 33 }       // Deep night blue
  }
};

// Time ranges in 24-hour format
const TIME_RANGES = {
  night: { start: 0, end: 5 },     // Midnight to 5am
  dawn: { start: 5, end: 7 },      // 5am to 7am
  morning: { start: 7, end: 10 },  // 7am to 10am
  day: { start: 10, end: 14 },     // 10am to 2pm
  afternoon: { start: 14, end: 17 },// 2pm to 5pm
  evening: { start: 17, end: 19 }, // 5pm to 7pm
  dusk: { start: 19, end: 21 },    // 7pm to 9pm
  late: { start: 21, end: 24 }     // 9pm to midnight
};

// Interpolate between two colors
function interpolateColor(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }, factor: number) {
  return {
    r: Math.round(color1.r + factor * (color2.r - color1.r)),
    g: Math.round(color1.g + factor * (color2.g - color1.g)),
    b: Math.round(color1.b + factor * (color2.b - color1.b))
  };
}

// Get the current time period
function getCurrentTimePeriod() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  
  for (const [period, range] of Object.entries(TIME_RANGES)) {
    if (hours >= range.start && hours < range.end) {
      return {
        period,
        progress: (hours - range.start) / (range.end - range.start)
      };
    }
  }
  
  // Default to night if something goes wrong
  return { period: 'night' as keyof typeof SKY_COLORS, progress: 0 };
}

// Get the current sky color
export function getCurrentSkyColor() {
  const { period, progress } = getCurrentTimePeriod();
  const colors = SKY_COLORS[period as keyof typeof SKY_COLORS];
  
  const color = interpolateColor(colors.start, colors.end, progress);
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

// Get gradient colors for a more realistic sky
export function getSkyGradient() {
  const { period, progress } = getCurrentTimePeriod();
  const colors = SKY_COLORS[period as keyof typeof SKY_COLORS];
  
  const baseColor = interpolateColor(colors.start, colors.end, progress);
  
  // Create a lighter top and darker bottom for more realistic sky
  const topColor = {
    r: Math.min(255, baseColor.r + 15),
    g: Math.min(255, baseColor.g + 15),
    b: Math.min(255, baseColor.b + 15)
  };
  
  const bottomColor = {
    r: Math.max(0, baseColor.r - 10),
    g: Math.max(0, baseColor.g - 10),
    b: Math.max(0, baseColor.b - 10)
  };
  
  return {
    top: `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`,
    bottom: `rgb(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`,
    base: `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`
  };
}

// A React hook that updates the sky color
export function useSkyColor(intervalInMs = 60000) {
  const [skyColors, setSkyColors] = useState(getSkyGradient());
  
  useEffect(() => {
    // Update immediately
    setSkyColors(getSkyGradient());
    
    // Then update periodically
    const interval = setInterval(() => {
      setSkyColors(getSkyGradient());
    }, intervalInMs);
    
    return () => clearInterval(interval);
  }, [intervalInMs]);
  
  return skyColors;
}