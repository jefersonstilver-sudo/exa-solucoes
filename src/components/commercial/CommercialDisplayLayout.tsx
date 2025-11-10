import React from 'react';
import { cn } from '@/lib/utils';

interface CommercialDisplayLayoutProps {
  video: React.ReactNode;
  notices: React.ReactNode;
  news: React.ReactNode;
  photo: React.ReactNode;
  ticker: React.ReactNode;
  weather: React.ReactNode;
  className?: string;
}

export const CommercialDisplayLayout: React.FC<CommercialDisplayLayoutProps> = ({
  video,
  notices,
  news,
  photo,
  ticker,
  weather,
  className
}) => {
  return (
    <div className={cn(
      "w-full space-y-2 md:space-y-4",
      className
    )}>
      {/* Vídeo sempre em primeiro - 100% width */}
      <div className="w-full">
        {video}
      </div>

      {/* Grid responsivo para os painéis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
        {/* Avisos - Mobile: full width, Desktop: 40% */}
        <div className="md:col-span-1">
          {notices}
        </div>

        {/* Container direito - Desktop: 60% */}
        <div className="md:col-span-1 space-y-2 md:space-y-4">
          {/* Notícias */}
          <div>
            {news}
          </div>

          {/* Foto + Data */}
          <div>
            {photo}
          </div>
        </div>
      </div>

      {/* Ticker de cotações - 100% width */}
      <div className="w-full">
        {ticker}
      </div>

      {/* Weather footer - 100% width */}
      <div className="w-full">
        {weather}
      </div>
    </div>
  );
};
