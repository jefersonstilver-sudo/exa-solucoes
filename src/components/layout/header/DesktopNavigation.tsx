
import { Link } from 'react-router-dom';

const DesktopNavigation = () => {
  return (
    <nav className="hidden md:flex space-x-8">
      <Link 
        to="/" 
        className="text-white hover:text-indexa-mint transition-colors duration-200 font-medium"
      >
        Home
      </Link>
      <Link 
        to="/linkae" 
        className="text-white hover:text-indexa-mint transition-colors duration-200 font-medium"
      >
        LINKAÊ
      </Link>
      <Link 
        to="/produtora" 
        className="text-white hover:text-indexa-mint transition-colors duration-200 font-medium"
      >
        Produtora
      </Link>
      <Link 
        to="/loja" 
        className="text-white hover:text-indexa-mint transition-colors duration-200 font-medium"
      >
        Loja Online
      </Link>
      <Link 
        to="/exa" 
        className="text-white hover:text-indexa-mint transition-colors duration-200 font-medium"
      >
        EXA
      </Link>
      <Link 
        to="/sou-sindico" 
        className="text-white hover:text-indexa-mint transition-colors duration-200 font-medium"
      >
        Sou Síndico
      </Link>
    </nav>
  );
};

export default DesktopNavigation;
