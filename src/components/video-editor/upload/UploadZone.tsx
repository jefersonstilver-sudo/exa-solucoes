import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Film, Image as ImageIcon, Music, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVideoUpload } from '@/hooks/video-editor/useVideoUpload';
import { AssetType } from '@/types/videoEditor';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onUploadComplete?: () => void;
  projectId?: string;
  acceptedTypes?: AssetType[];
}

const UploadZone = ({ onUploadComplete, projectId, acceptedTypes = ['video', 'image', 'audio'] }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { upload, uploadProgress, clearProgress, isUploading } = useVideoUpload();

  const getAcceptString = () => {
    const accepts: string[] = [];
    if (acceptedTypes.includes('video')) accepts.push('video/*');
    if (acceptedTypes.includes('image')) accepts.push('image/*');
    if (acceptedTypes.includes('audio')) accepts.push('audio/*');
    return accepts.join(',');
  };

  const getAssetType = (file: File): AssetType => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'video';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const type = getAssetType(file);
      if (acceptedTypes.includes(type)) {
        upload({ file, type, projectId });
      }
    });
  }, [upload, projectId, acceptedTypes]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const type = getAssetType(file);
      upload({ file, type, projectId });
    });
    e.target.value = '';
  };

  const progressEntries = Object.entries(uploadProgress);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
        )}
      >
        <input
          type="file"
          multiple
          accept={getAcceptString()}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-4 pointer-events-none">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragging ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-8 w-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>

          <div className="text-center">
            <p className="text-lg font-medium mb-1">
              {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p className="text-sm text-muted-foreground">
              {acceptedTypes.includes('video') && 'Vídeos até 15s'}
              {acceptedTypes.includes('image') && ', Imagens'}
              {acceptedTypes.includes('audio') && ', Áudios'}
            </p>
          </div>

          <div className="flex gap-3">
            {acceptedTypes.includes('video') && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Film className="h-4 w-4" />
                <span>MP4, WebM</span>
              </div>
            )}
            {acceptedTypes.includes('image') && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>JPG, PNG</span>
              </div>
            )}
            {acceptedTypes.includes('audio') && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Music className="h-4 w-4" />
                <span>MP3, WAV</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {progressEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {progressEntries.map(([fileName, progress]) => (
              <motion.div
                key={fileName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-card border rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {progress.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    {progress.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    {(progress.status === 'uploading' || progress.status === 'processing') && (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{fileName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearProgress(fileName)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {progress.status === 'error' ? (
                  <p className="text-xs text-destructive">{progress.error}</p>
                ) : progress.status === 'completed' ? (
                  <p className="text-xs text-green-600">Upload concluído</p>
                ) : (
                  <>
                    <Progress value={progress.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {progress.status === 'processing' ? 'Processando...' : `${Math.round(progress.progress)}%`}
                    </p>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadZone;
