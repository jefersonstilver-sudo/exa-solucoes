
import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-64 bg-indexa-purple shadow-xl">
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="px-4 space-y-4">
          <Link 
            to="/" 
            className="block text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat py-2"
            onClick={onClose}
          >
            EXA
          </Link>
          <Link 
            to="/loja" 
            className="block text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat py-2"
            onClick={onClose}
          >
            Loja Online
          </Link>
          <Link 
            to="/sou-sindico" 
            className="block text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat py-2"
            onClick={onClose}
          >
            Sou Síndico
          </Link>
          <Link 
            to="/contato" 
            className="block text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat py-2"
            onClick={onClose}
          >
            Contato
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
