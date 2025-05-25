
import React from 'react';
import { Link } from 'react-router-dom';

const HeaderLogo: React.FC = () => {
  return (
    <Link 
      to="/" 
      className="flex items-center hover:opacity-80 transition-opacity duration-200"
    >
      <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
        <img 
          src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
          alt="Indexa Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </Link>
  );
};

export default HeaderLogo;
