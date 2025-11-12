
import React from 'react';
import { Link } from 'react-router-dom';

interface LoginFooterProps {
  redirectPath: string;
}

export const LoginFooter = ({ redirectPath }: LoginFooterProps) => {
  return (
    <>
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Não tem uma conta?</span>{' '}
        <Link 
          to={`/cadastro${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
          className="font-medium text-exa-red hover:text-exa-red/90 hover:underline transition-colors"
        >
          Crie uma agora
        </Link>
      </div>
    </>
  );
};
