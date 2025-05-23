import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type UploadStatusProps = {
  uploadStatus: 'idle' | 'validating' | 'uploading' | 'processing' | 'success' | 'error';
  videoFile: File | null;
  videoDuration: number | null;
  videoOrientation: 'landscape' | 'portrait' | 'unknown';
  videoError: string | null;
  uploadProgress: number;
  handleReset: () => void;
  startUpload: () => void;
  handleContinue: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const UploadStatus: React.FC<UploadStatusProps> = ({
  uploadStatus,
  videoFile,
  videoDuration,
  videoOrientation,
  videoError,
  uploadProgress,
  handleReset,
  startUpload,
  handleContinue,
  fileInputRef,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileUpload
}) => {
  return (
    <div className="mt-6">
      {uploadStatus === 'success' ? (
        <motion.div
          key="success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-lg p-8 bg-green-50 border border-green-100 text-center"
        >
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-medium text-green-800 mb-2">
            Vídeo enviado com sucesso!
          </h3>
          <p className="text-green-700 mb-6">
            Seu vídeo foi recebido e está aguardando aprovação.<br />
            Nossa equipe irá analisá-lo em até 24 horas.
          </p>
          <Button 
            onClick={handleContinue}
            className="bg-indexa-purple hover:bg-indexa-purple/90"
          >
            Ir para o Dashboard
          </Button>
        </motion.div>
      ) : uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
        <motion.div
          key="uploading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-lg p-8 bg-gray-50 border border-gray-200 text-center"
        >
          <RefreshCw className="mx-auto h-12 w-12 text-indexa-purple animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {uploadStatus === 'uploading' ? 'Enviando seu vídeo...' : 'Processando...'}
          </h3>
          
          <div className="w-full mb-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="mt-1 text-sm text-gray-600">{uploadProgress}%</p>
          </div>
          
          <p className="text-gray-600">
            {uploadStatus === 'uploading' 
              ? 'Por favor, aguarde enquanto seu vídeo é enviado.' 
              : 'Finalizando e criando sua campanha...'}
          </p>
        </motion.div>
      ) : uploadStatus === 'error' ? (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-lg p-6 bg-red-50 border border-red-100"
        >
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Erro ao processar o vídeo
              </h3>
              <p className="text-red-700 mb-4">
                {videoError || 'Ocorreu um erro ao enviar seu vídeo. Por favor, tente novamente.'}
              </p>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        </motion.div>
      ) : videoFile ? (
        <motion.div
          key="preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-4"
        >
          <div className="rounded-lg p-6 bg-gray-100 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileUp className="h-5 w-5 text-indexa-purple mr-2" />
                <span className="font-medium truncate max-w-[280px]">{videoFile.name}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleReset}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1 mt-4">
              <div className="flex justify-between">
                <span>Tamanho:</span>
                <span>{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              {videoDuration !== null && (
                <div className="flex justify-between">
                  <span>Duração:</span>
                  <span className={videoDuration > 45 ? 'text-red-500 font-medium' : ''}>
                    {Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}
                    {videoDuration > 45 && ' (excede o limite)'}
                  </span>
                </div>
              )}
              {videoOrientation !== 'unknown' && (
                <div className="flex justify-between">
                  <span>Orientação:</span>
                  <span className={videoOrientation !== 'landscape' ? 'text-red-500 font-medium' : ''}>
                    {videoOrientation === 'landscape' ? 'Horizontal ✓' : 'Vertical ✗'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={handleReset}
            >
              Selecionar outro arquivo
            </Button>
            
            <Button 
              onClick={startUpload}
              disabled={!!videoError || uploadStatus === 'validating' || !videoDuration}
              className="bg-indexa-purple hover:bg-indexa-purple/90 disabled:bg-gray-300"
            >
              {uploadStatus === 'validating' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                'Iniciar upload'
              )}
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="dropzone"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="video/mp4,video/quicktime,video/avi"
            onChange={handleFileUpload}
          />
          <FileUp className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            Arraste e solte seu vídeo aqui, ou clique para selecionar
          </p>
          <p className="mt-2 text-sm text-gray-500">
            MP4, MOV ou AVI (máx. 100MB)
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default UploadStatus;
