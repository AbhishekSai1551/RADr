import { Link, useLocation } from 'wouter';
import { MapPin, UsersRound, Plus, User } from 'lucide-react';
import { AppLogo } from './logo';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const MobileNavigation = () => {
  const [location] = useLocation();
  
  const navItems: NavItem[] = [
    { 
      path: '/', 
      label: 'Discover', 
      icon: <MapPin className="text-lg" /> 
    },
    { 
      path: '/zones', 
      label: 'Zones', 
      icon: <UsersRound className="text-lg" />
    },
    { 
      path: '/connections', 
      label: 'Connections', 
      icon: <Plus className="text-lg" /> 
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: <User className="text-lg" /> 
    }
  ];
  
  return (
    <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around items-center h-16 shadow-md fixed bottom-0 w-full z-10">
      {navItems.map((item) => (
        <Link key={item.path} href={item.path}>
          <a className={`flex flex-col items-center justify-center px-3 py-1 ${
            location === item.path 
              ? 'text-primary' 
              : 'text-gray-500'
          }`}>
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-secondary text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNavigation;