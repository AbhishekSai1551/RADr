import React from 'react';
import { Link, useLocation } from 'wouter';
import { User } from '@shared/schema';
import { 
  MapPin, 
  UsersRound, 
  Plus, 
  User as UserIcon, 
  Settings, 
  HelpCircle, 
  LogOut
} from 'lucide-react';
import { AppLogo } from './logo';
import { useAuth } from '@/hooks/use-auth';

interface SideNavigationProps {
  user: User;
}

const SideNavigation: React.FC<SideNavigationProps> = ({ user }) => {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    { 
      path: '/', 
      label: 'Discover', 
      icon: <MapPin className="w-5 h-5 mr-3" />,
      notification: 0
    },
    { 
      path: '/zones', 
      label: 'Zones', 
      icon: <UsersRound className="w-5 h-5 mr-3" />,
      notification: 0
    },
    { 
      path: '/connections', 
      label: 'Connections', 
      icon: <Plus className="w-5 h-5 mr-3" />,
      notification: 0
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: <UserIcon className="w-5 h-5 mr-3" />,
      notification: 0
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5 mr-3" />,
      notification: 0
    }
  ];
  
  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 h-screen">
      <div className="p-4 border-b border-gray-200">
        <AppLogo className="text-2xl text-primary" />
        <p className="text-sm text-gray-500 mt-1">Connect with nearby people</p>
      </div>
      
      {/* Profile Summary */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
            alt={user.name}
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
          <div>
            <h3 className="font-semibold text-sm">{user.name}</h3>
            <p className="text-xs text-gray-500">{user.profession || 'No profession listed'}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a 
              className={`flex items-center px-4 py-2 rounded-md ${
                location === item.path
                  ? 'text-gray-800 bg-gray-100'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {React.cloneElement(item.icon, { 
                className: `${item.icon.props.className} ${
                  location === item.path ? 'text-primary' : 'text-gray-400'
                }`
              })}
              <span>{item.label}</span>
              {item.notification > 0 && (
                <span className="ml-auto bg-secondary text-white text-xs px-1.5 py-0.5 rounded-full">
                  {item.notification}
                </span>
              )}
            </a>
          </Link>
        ))}
      </nav>
      
      {/* Help & Logout */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/help">
          <a className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
            <HelpCircle className="w-5 h-5 mr-3 text-gray-400" />
            <span>Help</span>
          </a>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <LogOut className="w-5 h-5 mr-3 text-gray-400" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default SideNavigation;