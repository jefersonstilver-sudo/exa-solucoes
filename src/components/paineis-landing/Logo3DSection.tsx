
import React, { useState, useEffect } from 'react';

const Logo3DSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed top-8 right-8 md:top-12 md:right-12 z-40 transition-all duration-1000 ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
    }`}>
      <div className="relative group">
        <img
          src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/imagens%20pagina%20painel/ChatGPT%20Image%2019%20de%20abr.%20de%202025,%2001_00_44.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9pbWFnZW5zIHBhZ2luYSBwYWluZWwvQ2hhdEdQVCBJbWFnZSAxOSBkZSBhYnIuIGRlIDIwMjUsIDAxXzAwXzQ0LnBuZyIsImlhdCI6MTc0ODY1MjExMSwiZXhwIjoxNzgwMTg4MTExfQ.OPd7mFSKIdeO28wKR0GCBHaqmRKtNx4UUCCuI4_anGs"
          alt="Indexa 3D Logo"
          className="w-16 h-16 md:w-20 md:h-20 object-contain filter drop-shadow-2xl"
          style={{
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70" />
      </div>
    </div>
  );
};

export default Logo3DSection;
