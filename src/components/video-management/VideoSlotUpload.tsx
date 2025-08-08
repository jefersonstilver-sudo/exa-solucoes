
import React, { useState, useRef } from 'react';
import { Upload, Loader2, Video } from 'lucide-react';
import { VideoTitleInput } from '@/components/video-upload/VideoTitleInput';
import { VideoUploadScheduleForm, ScheduleRule } from '@/components/video-upload/VideoUploadScheduleForm';
import { Button } from '@/components/ui/button';

interface VideoSlotUploadProps {
  slotPosition: number;
  uploading: boolean;
  isUploading: boolean;
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: ScheduleRule[]) => void;
}

export const VideoSlotUpload: React.FC<VideoSlotUploadProps> = ({
  slotPosition,
  uploading,
  isUploading,
  onUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateTitle = (title: string): boolean => {
    if (!title.trim()) {
      setTitleError('Título é obrigatório');
      return false;
    }
    if (title.length < 3) {
      setTitleError('Título deve ter pelo menos 3 caracteres');
      return false;
    }
    if (title.length > 50) {
      setTitleError('Título deve ter no máximo 50 caracteres');
      return false;
    }
    setTitleError('');
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    const validTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo de vídeo válido (MP4, MOV, AVI)');
      return;
    }

    // Validar tamanho (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 100MB');
      return;
    }

    setSelectedFile(file);
  };

  // Upload direto sem agendamento
  const handleDirectUpload = () => {
    if (!validateTitle(videoTitle)) {
      return;
    }

    if (!selectedFile) {
      alert('Por favor, selecione um arquivo de vídeo');
      return;
    }

    onUpload(slotPosition, selectedFile, videoTitle);
    
    // Reset after upload
    setSelectedFile(null);
    setVideoTitle('');
    setTitleError('');
  };

  const canUpload = selectedFile && videoTitle.trim() && !uploading && !isUploading;

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
        id={`file-upload-${slotPosition}`}
      />
      
      <div className="space-y-4">
        <div>
          <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 font-medium mb-2">Clique para enviar seu vídeo</p>
          <p className="text-sm text-gray-500">
            Formatos aceitos: MP4, MOV, AVI (máx. 100MB)
          </p>
        </div>
        
        <VideoTitleInput
          title={videoTitle}
          onTitleChange={setVideoTitle}
          error={titleError}
          placeholder={`Título do vídeo ${slotPosition}`}
        />
        
        <label htmlFor={`file-upload-${slotPosition}`}>
          <Button 
            asChild
            variant="outline" 
            className="w-full cursor-pointer"
            disabled={uploading || isUploading}
          >
            <span>
              {selectedFile ? selectedFile.name : 'Selecionar Arquivo'}
            </span>
          </Button>
        </label>
        
        {selectedFile && (
          <div className="text-xs text-gray-500 bg-white p-2 rounded border">
            <strong>Arquivo:</strong> {selectedFile.name}<br/>
            <strong>Tamanho:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </div>
        )}
      </div>

      {/* Botão principal - Upload direto */}
      <Button
        onClick={handleDirectUpload}
        disabled={!canUpload}
        className="w-full mt-4"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Enviando...
          </>
        ) : (
          'Enviar Vídeo'
        )}
      </Button>

    </div>
  );
};
