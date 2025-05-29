
import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface VideoSlotUploadProps {
  slotPosition: number;
  uploading: boolean;
  isUploading: boolean;
  onUpload: (slotPosition: number, file: File) => void;
}

export const VideoSlotUpload: React.FC<VideoSlotUploadProps> = ({
  slotPosition,
  uploading,
  isUploading,
  onUpload
}) => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p className="text-sm text-gray-600 mb-4">
        Clique para enviar vídeo ou arraste aqui (máx. 15s, horizontal, 100MB)
      </p>
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/avi,video/mov"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUpload(slotPosition, file);
          }
        }}
        className="hidden"
        id={`upload-${slotPosition}`}
        disabled={uploading || isUploading}
      />
      <label 
        htmlFor={`upload-${slotPosition}`}
        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
          (uploading || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {isUploading ? 'Enviando...' : 'Escolher Arquivo'}
      </label>
    </div>
  );
};
