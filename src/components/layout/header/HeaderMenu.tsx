
import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderMenuProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({ 
  isMobile = false,
  onLinkClick = () => {}
}) => {
  const menuItems = [
    { name: "Produtora", link: "/" },
    { name: "Marketing", link: "/" },
    { name: "Painéis Digitais", link: "/paineis-digitais" }
  ];

  if (isMobile) {
    return (
      <div className="flex flex-col p-4 gap-4">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            to={item.link} 
            className="text-white/90 font-medium p-2 hover:bg-white/10 rounded-md"
            onClick={onLinkClick}
          >
            {item.name}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="hidden md:flex gap-6 ml-12">
      {menuItems.map((item) => (
        <Link 
          key={item.name}
          to={item.link} 
          className="text-white/90 font-medium hover:text-white transition-colors"
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default HeaderMenu;
