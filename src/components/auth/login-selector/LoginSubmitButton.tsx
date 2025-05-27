
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface LoginSubmitButtonProps {
  loading: boolean;
}

const LoginSubmitButton: React.FC<LoginSubmitButtonProps> = ({ loading }) => {
  return (
    <Button 
      type="submit" 
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md"
      disabled={loading}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
          Entrando...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <LogIn className="mr-2 h-5 w-5" />
          Entrar
        </div>
      )}
    </Button>
  );
};

export default LoginSubmitButton;
