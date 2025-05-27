
import React, { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import LoginSelector from './LoginSelector';
import UserMenu from '@/components/user/UserMenu';
import { ClientOnly } from '@/components/ui/client-only';

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
        {/* Se usuário estiver logado, mostra o UserMenu profissional */}
        {isLoggedIn ? (
          <UserMenu />
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:bg-white/20 rounded-full group h-10 w-10 md:h-12 md:w-12"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Login"
            >
              <User className="h-5 w-5 md:h-6 md:w-6 text-gray-300" />
            </Button>
            
            {isOpen && (
              <LoginSelector onLoginSuccess={() => setIsOpen(false)} />
            )}
          </>
        )}
      </div>
    </ClientOnly>
  );
};

export default UserAccessButton;
