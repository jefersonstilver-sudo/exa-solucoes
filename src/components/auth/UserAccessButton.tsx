
import React, { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import LoginSelector from './LoginSelector';
import { ClientOnly } from '@/components/ui/client-only';
import AdminAccessButton from '@/components/admin/AdminAccessButton';

const UserAccessButton = () => {
  const { isLoggedIn, user, isLoading } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render the button at all if we're still loading the authentication state
  if (isLoading) {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <ClientOnly fallback={
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></div>
      </div>
    }>
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/20 rounded-full group"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Login"
        >
          <User className={`h-6 w-6 ${isLoggedIn ? 'text-indexa-mint' : 'text-gray-300'}`} />
          {isLoggedIn && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center"></span>
          )}
          {user?.role === 'admin' && (
            <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center"></span>
          )}
          {user?.role === 'super_admin' && (
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center"></span>
          )}
        </Button>
        
        {isOpen && !isLoggedIn && (
          <LoginSelector onLoginSuccess={() => setIsOpen(false)} />
        )}
      </div>
    </ClientOnly>
  );
};

export default UserAccessButton;
