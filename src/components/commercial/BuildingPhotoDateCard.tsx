import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuildingPhotoDateCardProps {
  buildingId: string;
  className?: string;
}

export const BuildingPhotoDateCard: React.FC<BuildingPhotoDateCardProps> = ({ 
  buildingId,
  className 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Buscar foto do prédio
  useEffect(() => {
    const fetchBuildingPhoto = async () => {
      if (!buildingId) return;

      const { data } = await supabase
        .from('buildings')
        .select('imagem_principal')
        .eq('id', buildingId)
        .single();

      if (data?.imagem_principal) {
        setPhotoUrl(data.imagem_principal);
      }
    };

    fetchBuildingPhoto();
  }, [buildingId]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden shadow-lg",
        "min-h-[250px] md:min-h-[300px]",
        className
      )}
    >
      {/* Background - Foto do prédio ou fallback */}
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt="Foto do condomínio"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          <Camera className="h-16 w-16 text-white/20" />
        </div>
      )}

      {/* Overlay gradiente para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Data e Hora */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <div className="text-center space-y-2">
          {/* Data */}
          <p className="text-white/90 text-sm md:text-base capitalize">
            {formatDate(currentTime)}
          </p>

          {/* Hora */}
          <div className="text-white text-3xl md:text-5xl font-bold font-mono tracking-wider drop-shadow-lg">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
};
