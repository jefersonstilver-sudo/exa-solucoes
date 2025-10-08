
import { Link } from 'react-router-dom';

const DesktopNavigation = () => {
  return (
    <nav className="hidden md:flex space-x-8">
      <Link 
        to="/" 
        className="text-white hover:text-indexa-mint transition-colors duration-200 font-medium"
      >
        EXA
      </Link>
      <Link 
        to="/loja" 
        className="text-white hover:text-indexa-mint transition-colors duration-200 font-medium"
      >
        Loja Online
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
