import { useCheeseColor } from "@/lib/cheese-colors";

interface DynamicBackgroundProps {
  children: React.ReactNode;
}

export function DynamicBackground({ children }: DynamicBackgroundProps) {
  const cheeseColors = useCheeseColor();
  
  return (
    <div 
      className="min-h-screen relative flex flex-col"
      style={{
        background: `linear-gradient(to bottom, ${cheeseColors.top} 0%, ${cheeseColors.bottom} 100%)`,
        transition: "background 2s ease-in-out"
      }}
    >
      {/* Fewer, widely spaced cheese holes with dark yellow shade - carefully positioned to avoid overlap */}
      <div 
        className="absolute inset-0 opacity-100 pointer-events-none mix-blend-darken"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(180, 130, 0, 0.7) 0%, transparent 10%, transparent 100%),
            radial-gradient(circle at 85% 25%, rgba(180, 130, 0, 0.7) 0%, transparent 12%, transparent 100%),
            radial-gradient(circle at 25% 65%, rgba(180, 130, 0, 0.7) 0%, transparent 11%, transparent 100%),
            radial-gradient(circle at 75% 75%, rgba(180, 130, 0, 0.7) 0%, transparent 13%, transparent 100%)
          `,
          backgroundSize: "100% 100%", // Use percentage to ensure holes are positioned relative to container size
          backgroundRepeat: "no-repeat"
        }}
      ></div>

      {/* Secondary hole - just one in the middle to avoid overlap */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 45%, rgba(190, 140, 0, 0.7) 0%, transparent 10%, transparent 100%)
          `,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat"
        }}
      ></div>
      
      {/* Cheese texture overlay for a more natural look */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: "100px 100px"
        }}
      ></div>
      
      {/* Shadow/depth effect for the holes - positioned to match the actual holes */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, transparent 0%, rgba(170, 120, 0, 0.6) 12%, transparent 16%, transparent 100%),
            radial-gradient(circle at 85% 25%, transparent 0%, rgba(170, 120, 0, 0.6) 14%, transparent 18%, transparent 100%),
            radial-gradient(circle at 25% 65%, transparent 0%, rgba(170, 120, 0, 0.6) 13%, transparent 17%, transparent 100%),
            radial-gradient(circle at 75% 75%, transparent 0%, rgba(170, 120, 0, 0.6) 15%, transparent 19%, transparent 100%),
            radial-gradient(ellipse at 50% 45%, transparent 0%, rgba(170, 120, 0, 0.6) 12%, transparent 16%, transparent 100%)
          `,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat"
        }}
      ></div>
      <div className="flex-1 relative z-10">
        {children}
      </div>
    </div>
  );
}