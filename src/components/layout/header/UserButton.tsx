
import React from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const UserButton: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-white hover:bg-white/20 rounded-full"
    >
      <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-9 w-9'} bg-indexa-purple-light border-2 border-indexa-mint`}>
        <AvatarFallback className="bg-indexa-purple-light text-white">
          <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </AvatarFallback>
      </Avatar>
    </Button>
  );
};

export default UserButton;
