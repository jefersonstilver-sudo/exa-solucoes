
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VideoTitleInputProps {
  title: string;
  onTitleChange: (title: string) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
}

export const VideoTitleInput: React.FC<VideoTitleInputProps> = ({
  title,
  onTitleChange,
  error,
  placeholder = "Ex: Promoção Black Friday 2024",
  maxLength = 50
}) => {
  const isValid = title.length >= 3 && title.length <= maxLength;
  const remainingChars = maxLength - title.length;

  return (
    <div className="space-y-2">
      <Label htmlFor="video-title" className="text-sm font-medium">
        Título do Vídeo <span className="text-red-500">*</span>
      </Label>
      <div className="space-y-1">
        <Input
          id="video-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full ${error ? 'border-red-500' : isValid ? 'border-green-500' : ''}`}
        />
        <div className="flex justify-between items-center text-xs">
          <span className={`${title.length < 3 ? 'text-red-500' : 'text-gray-500'}`}>
            Mínimo 3 caracteres
          </span>
          <span className={`${remainingChars < 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {remainingChars} caracteres restantes
          </span>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
      {isValid && (
        <p className="text-green-600 text-xs">✓ Título válido</p>
      )}
    </div>
  );
};
