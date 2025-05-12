
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
          className="font-medium text-indexa-purple hover:text-indexa-purple-dark hover:underline transition-colors"
        >
          Crie uma agora
        </Link>
      </div>
      
      <div className="text-center text-xs text-muted-foreground">
        <p>Ao entrar, você concorda com os nossos <a href="#" className="underline hover:text-indexa-purple transition-colors">termos de uso</a> e <a href="#" className="underline hover:text-indexa-purple transition-colors">política de privacidade</a>.</p>
      </div>
    </>
  );
};
