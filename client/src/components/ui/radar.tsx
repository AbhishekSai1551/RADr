import React, { useState, useEffect } from 'react';
import { UserProfile } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, Cloud, CloudRain, Sun, Moon, Stars } from 'lucide-react';
import { useSkyColor } from '@/lib/sky-colors';

// Weather types to display on radar
type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'starry' | 'default';

interface RadarProps {
  currentLocation: {
    latitude: number | null;
    longitude: number | null;
  };
  nearbyUsers: UserProfile[];
  maxDistance: number;
  onUserSelect: (user: UserProfile) => void;
  onMessageRequest: (user: UserProfile) => void;
}

const Radar: React.FC<RadarProps> = ({
  currentLocation,
  nearbyUsers,
  maxDistance,
  onUserSelect,
  onMessageRequest
}) => {
  const [rotation, setRotation] = useState(0);
  const [weather, setWeather] = useState<WeatherType>('default');
  const [indiaTime, setIndiaTime] = useState('');
  const skyColors = useSkyColor();
  
  // Set the radar rotation to match India time (Vizag is in India - UTC+5:30)
  useEffect(() => {
    // Function to calculate India time and set rotation
    const updateIndiaTimeRotation = () => {
      const now = new Date();
      
      // Calculate India time (UTC+5:30)
      let indiaHours = now.getUTCHours() + 5;
      let indiaMinutes = now.getUTCMinutes() + 30;
      
      // Adjust for overflow
      if (indiaMinutes >= 60) {
        indiaHours += 1;
        indiaMinutes -= 60;
      }
      indiaHours = indiaHours % 24;
      
      // Format time for display (12-hour with AM/PM)
      const ampm = indiaHours >= 12 ? 'PM' : 'AM';
      const hours12 = indiaHours % 12 || 12; // Convert 0 to 12 for 12 AM
      const minutesStr = indiaMinutes < 10 ? `0${indiaMinutes}` : `${indiaMinutes}`;
      const timeStr = `${hours12}:${minutesStr} ${ampm} IST`;
      
      // Update the time string state
      setIndiaTime(timeStr);
      
      // Convert time to rotation degrees (24 hours = 360 degrees)
      // Hours: each hour = 30 degrees (360/12)
      // Minutes: each minute = 0.5 degrees (30/60)
      const hourRotation = (indiaHours % 12) * 30;
      const minuteRotation = indiaMinutes * 0.5;
      
      // Set radar rotation based on current time in India
      setRotation(hourRotation + minuteRotation);
    };
    
    // Initial update
    updateIndiaTimeRotation();
    
    // Update every minute (60000ms)
    const interval = setInterval(updateIndiaTimeRotation, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Set weather based on current time in India (Vizag)
  useEffect(() => {
    // Function to determine appropriate weather based on time of day
    const determineWeatherByTime = () => {
      const now = new Date();
      
      // Calculate India time (UTC+5:30)
      let indiaHours = now.getUTCHours() + 5;
      let indiaMinutes = now.getUTCMinutes() + 30;
      
      // Adjust for overflow
      if (indiaMinutes >= 60) {
        indiaHours += 1;
        indiaMinutes -= 60;
      }
      indiaHours = indiaHours % 24;
      
      // Determine weather based on time of day in India
      let currentWeather: WeatherType;
      if (indiaHours >= 6 && indiaHours < 18) {
        // Daytime: Sunny (6 AM to 6 PM)
        currentWeather = 'sunny';
      } else {
        // Nighttime: Starry (6 PM to 6 AM)
        currentWeather = 'starry';
      }
      
      return currentWeather;
    };
    
    // Set weather initially
    setWeather(determineWeatherByTime());
    
    // Update weather every hour
    const weatherInterval = setInterval(() => {
      setWeather(determineWeatherByTime());
    }, 60 * 60 * 1000); // Update every hour
    
    return () => clearInterval(weatherInterval);
  }, []);
  
  if (!currentLocation.latitude || !currentLocation.longitude) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Waiting for location...</p>
      </div>
    );
  }
  
  // Calculate position of users on the radar - only showing users within 500m
  const calculatePosition = (user: UserProfile) => {
    if (!user.latitude || !user.longitude || !user.distance) return { x: 0, y: 0 };
    
    // Convert miles to meters (1 mile ≈ 1609 meters)
    const distanceInMeters = user.distance * 1609;
    
    // Only show users within 500 meters
    if (distanceInMeters > 500) return null;
    
    // Normalize distance to percentage of radar size (0-100%)
    // 500m = full radar size (100%)
    const distancePercent = (distanceInMeters / 500) * 100;
    
    // Calculate angle (simplified - not actual geospatial calculation)
    // In a real app, you would use proper geospatial calculations for bearing
    const dx = user.longitude - (currentLocation.longitude || 0);
    const dy = user.latitude - (currentLocation.latitude || 0);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Convert polar coordinates to cartesian
    const radians = angle * (Math.PI / 180);
    const x = Math.cos(radians) * distancePercent;
    const y = Math.sin(radians) * distancePercent;
    
    return { x, y };
  };
  
  // Calculate mutual interests score (0-100)
  const calculateInterestScore = (user: UserProfile) => {
    // This is a placeholder calculation
    // In a real app, this would compare the current user's interests with the target user
    return Math.min(Math.floor(Math.random() * 100), 100);
  };
  
  // Calculate profession compatibility (0-100)
  const calculateProfessionScore = (user: UserProfile) => {
    // Placeholder
    return Math.min(Math.floor(Math.random() * 100), 100);
  };
  
  // Calculate overall match score
  const calculateMatchScore = (user: UserProfile) => {
    const interestScore = calculateInterestScore(user);
    const professionScore = calculateProfessionScore(user);
    
    // Weighted score calculation (no longer factoring in distance since we have a fixed radius)
    return Math.floor((interestScore * 0.6) + (professionScore * 0.4));
  };
  
  // Helper function to get background color based on weather and sky color
  const getRadarBackgroundStyle = () => {
    // Base styles using sky colors
    let bgGradient = `radial-gradient(circle at center, ${skyColors.top} 0%, ${skyColors.bottom} 100%)`;
    let borderColor = 'border-indigo-100';
    let scanColor = 'from-indigo-500/10 to-indigo-600/60';
    let scanColorH = 'from-indigo-500/10 via-indigo-600/60 to-indigo-500/10';
    let opacity = '0.9';
    
    // Adjust based on weather
    switch (weather) {
      case 'sunny':
        bgGradient = `radial-gradient(circle at center, ${skyColors.top} 0%, ${skyColors.bottom} 100%)`;
        borderColor = 'border-amber-100';
        scanColor = 'from-amber-400/20 to-amber-500/70';
        scanColorH = 'from-amber-400/20 via-amber-500/70 to-amber-400/20';
        opacity = '0.85';
        break;
      case 'cloudy':
        bgGradient = `radial-gradient(circle at center, rgba(220, 220, 230, 0.9) 0%, rgba(180, 180, 195, 0.9) 100%)`;
        borderColor = 'border-gray-300';
        scanColor = 'from-gray-400/20 to-gray-500/60';
        scanColorH = 'from-gray-400/20 via-gray-500/60 to-gray-400/20';
        opacity = '0.92';
        break;
      case 'rainy':
        bgGradient = `radial-gradient(circle at center, rgba(150, 160, 190, 0.85) 0%, rgba(100, 110, 140, 0.85) 100%)`;
        borderColor = 'border-blue-200/70';
        scanColor = 'from-blue-400/20 to-blue-600/60';
        scanColorH = 'from-blue-400/20 via-blue-600/60 to-blue-400/20';
        opacity = '0.95';
        break;
      case 'starry':
        bgGradient = `radial-gradient(circle at center, rgba(30, 40, 80, 0.85) 0%, rgba(10, 15, 35, 0.85) 100%)`;
        borderColor = 'border-indigo-900/30';
        scanColor = 'from-indigo-400/10 to-indigo-300/40';
        scanColorH = 'from-indigo-400/10 via-indigo-300/40 to-indigo-400/10';
        opacity = '0.9';
        break;
    }
    
    return { bgGradient, borderColor, scanColor, scanColorH, opacity };
  };
  
  const { bgGradient, borderColor, scanColor, scanColorH, opacity } = getRadarBackgroundStyle();
  
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: skyColors.base }}
    >
      {/* Weather effects layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Sunny effect - sun rays */}
        {weather === 'sunny' && (
          <>
            <div className="absolute top-2 right-2 animate-pulse-slow">
              <Sun className="text-yellow-400 h-12 w-12" />
            </div>
            <div 
              className="absolute top-2 right-2 opacity-30 w-[300px] h-[300px] animate-spin-very-slow"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.3) 0%, transparent 70%)'
              }}
            ></div>
          </>
        )}
        
        {/* Cloudy effect - floating clouds */}
        {weather === 'cloudy' && (
          <>
            <div className="absolute top-4 left-[10%] animate-float-slow duration-[15s]">
              <Cloud className="text-gray-400 h-10 w-10" />
            </div>
            <div className="absolute top-8 right-[15%] animate-float-slow duration-[18s] delay-500">
              <Cloud className="text-gray-500 h-12 w-12" />
            </div>
            <div className="absolute top-20 left-[30%] animate-float-slow duration-[12s] delay-1000">
              <Cloud className="text-gray-400 h-8 w-8" />
            </div>
          </>
        )}
        
        {/* Rainy effect - rain drops */}
        {weather === 'rainy' && (
          <>
            <div className="absolute top-2 left-[20%] animate-float-slow duration-[20s]">
              <CloudRain className="text-blue-400 h-10 w-10" />
            </div>
            <div className="absolute top-6 right-[25%] animate-float-slow duration-[18s] delay-700">
              <CloudRain className="text-blue-500 h-12 w-12" />
            </div>
            <div className="absolute top-16 left-[40%] animate-float-slow duration-[15s] delay-1500">
              <Cloud className="text-blue-400 h-8 w-8" />
            </div>
            
            {/* Rain drops */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({length: 30}).map((_, i) => {
                const left = `${Math.random() * 100}%`;
                const delay = `${Math.random() * 2}s`;
                const duration = `${0.5 + Math.random() * 1.5}s`;
                const opacity = 0.2 + Math.random() * 0.4;
                
                return (
                  <div
                    key={i}
                    className="absolute w-[1px] h-[10px] bg-blue-300 animate-rain-drop"
                    style={{
                      left,
                      opacity,
                      animationDelay: delay,
                      animationDuration: duration
                    }}
                  ></div>
                );
              })}
            </div>
          </>
        )}
        
        {/* Starry night effect - twinkling stars */}
        {weather === 'starry' && (
          <div>
            <div className="absolute top-3 left-[15%] animate-twinkle duration-[4s]">
              <Stars className="text-indigo-200 h-8 w-8" />
            </div>
            <div className="absolute top-8 right-[20%] animate-twinkle duration-[3s] delay-500">
              <Stars className="text-indigo-200 h-6 w-6" />
            </div>
            <div className="absolute top-20 left-[35%] animate-pulse-slow duration-[10s]">
              <Moon className="text-indigo-100 h-10 w-10" />
            </div>
            <div className="absolute top-28 right-[40%] animate-twinkle duration-[5s] delay-1000">
              <Stars className="text-indigo-200 h-7 w-7" />
            </div>
            
            {/* Twinkling stars */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({length: 25}).map((_, i) => {
                const left = `${Math.random() * 100}%`;
                const top = `${Math.random() * 100}%`;
                const size = 1 + Math.random() * 2;
                const duration = `${1 + Math.random() * 4}s`;
                const delay = `${Math.random() * 5}s`;
                
                return (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white animate-twinkle"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left,
                      top,
                      animationDuration: duration,
                      animationDelay: delay
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Weather effects are defined in index.css */}
      
      {/* Radar background circles */}
      <div 
        className={`absolute w-[90vw] h-[90vw] md:w-[600px] md:h-[600px] rounded-full border-2 ${borderColor} flex items-center justify-center`}
        style={{ 
          background: bgGradient,
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.1)',
          opacity: opacity
        }}
      >
        {/* Removed the three inner circles as requested */}
        
        {/* Center point (current user) */}
        <div className="absolute w-6 h-6 rounded-full bg-indigo-600 shadow-lg z-10"></div>
        
        {/* Scanning animation */}
        <div 
          className="absolute w-full h-full"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className={`absolute top-0 left-1/2 bottom-0 w-[1px] bg-gradient-to-b ${scanColor}`}></div>
          <div className={`absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r ${scanColorH}`}></div>
          <div className="absolute top-0 right-0 bottom-0 left-0 rounded-full radial-pulse"></div>
        </div>
        
        {/* Nearby users */}
        <AnimatePresence>
          {nearbyUsers.map((user) => {
            const position = calculatePosition(user);
            if (!position) return null;
            
            const matchScore = calculateMatchScore(user);
            
            // Determine color based on match score
            let scoreColor = 'bg-gray-400';
            if (matchScore > 80) scoreColor = 'bg-green-500';
            else if (matchScore > 60) scoreColor = 'bg-indigo-500';
            else if (matchScore > 40) scoreColor = 'bg-blue-400';
            else if (matchScore > 20) scoreColor = 'bg-yellow-400';
            
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: `${position.x}%`,
                  y: `${position.y}%`
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute"
                style={{ 
                  left: '50%', 
                  top: '50%',
                  marginLeft: '-20px',
                  marginTop: '-20px'
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform relative"
                  onClick={() => onUserSelect(user)}
                >
                  <div className={`absolute inset-0 ${scoreColor} opacity-20 rounded-full animate-pulse`}></div>
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  
                  {/* Match percentage */}
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <span className="text-[10px] font-bold text-indigo-700">{matchScore}%</span>
                  </div>
                  
                  {/* Quick message button on hover */}
                  <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      className="h-7 rounded-full shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMessageRequest(user);
                      }}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span className="text-xs">Connect</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Distance indicator */}
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg shadow-md px-3 py-2">
        <p className="text-xs text-gray-500">Radar Range</p>
        <p className="font-medium text-indigo-700">500 meters</p>
      </div>
      
      {/* Weather indicator */}
      <div className="absolute top-4 right-4 bg-white/90 rounded-lg shadow-md px-3 py-2 flex items-center">
        {weather === 'sunny' && (
          <>
            <Sun className="h-4 w-4 text-amber-500 mr-2" />
            <p className="font-medium text-amber-700 text-xs">Sunny</p>
          </>
        )}
        {weather === 'cloudy' && (
          <>
            <Cloud className="h-4 w-4 text-gray-500 mr-2" />
            <p className="font-medium text-gray-700 text-xs">Cloudy</p>
          </>
        )}
        {weather === 'rainy' && (
          <>
            <CloudRain className="h-4 w-4 text-blue-500 mr-2" />
            <p className="font-medium text-blue-700 text-xs">Rainy</p>
          </>
        )}
        {weather === 'starry' && (
          <>
            <Stars className="h-4 w-4 text-indigo-500 mr-2" />
            <p className="font-medium text-indigo-700 text-xs">Night Sky</p>
          </>
        )}
        {weather === 'default' && (
          <>
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-amber-400 to-blue-400 mr-2" />
            <p className="font-medium text-gray-700 text-xs">Default</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Radar;