
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeaderLogo: React.FC = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div 
      onClick={handleLogoClick}
      className="flex items-center hover:opacity-80 transition-opacity duration-200 cursor-pointer py-2"
    >
      <div className="w-14 h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 flex items-center justify-center mr-3">
        <img 
          src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
          alt="Indexa Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="hidden md:block">
        <span className="text-white text-xl lg:text-2xl font-bold tracking-wide">
          INDEXA
        </span>
      </div>
    </div>
  );
};

export default HeaderLogo;
