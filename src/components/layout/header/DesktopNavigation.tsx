
import { Link } from 'react-router-dom';

const DesktopNavigation = () => {
  return (
    <nav className="hidden md:flex space-x-8">
      <Link 
        to="/" 
        className="text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat"
      >
        EXA
      </Link>
      <Link 
        to="/loja" 
        className="text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat"
      >
        Loja Online
      </Link>
      <Link 
        to="/sou-sindico" 
        className="text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat"
      >
        Sou Síndico
      </Link>
      <Link 
        to="/contato" 
        className="text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat"
      >
        Contato
      </Link>
      <Link 
        to="/blog" 
        className="text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat"
      >
        Blog
      </Link>
    </nav>
  );
};

export default DesktopNavigation;
