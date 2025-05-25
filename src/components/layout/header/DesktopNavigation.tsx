
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
}

interface DesktopNavigationProps {
  navItems: NavItem[];
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ navItems }) => {
  const location = useLocation();

  return (
    <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "text-sm font-medium transition-all duration-200 relative group px-2 py-1",
            location.pathname === item.to
              ? "text-indexa-mint"
              : "text-white/90 hover:text-white"
          )}
        >
          {item.label}
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indexa-mint transition-all duration-300 group-hover:w-full"></span>
        </Link>
      ))}
    </nav>
  );
};

export default DesktopNavigation;
