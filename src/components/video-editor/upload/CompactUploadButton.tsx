import { useState, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoUpload } from '@/hooks/video-editor/useVideoUpload';
import { AssetType } from '@/types/videoEditor';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface CompactUploadButtonProps {
  onUploadComplete?: () => void;
  projectId?: string;
  acceptedTypes?: AssetType[];
  className?: string;
}

export const CompactUploadButton = ({ 
  onUploadComplete, 
  projectId, 
  acceptedTypes = ['video', 'image', 'audio'],
  className 
}: CompactUploadButtonProps) => {
  const { upload, uploadProgress, isUploading } = useVideoUpload();
  const [showProgress, setShowProgress] = useState(false);

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

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setShowProgress(true);
    
    for (const file of files) {
      const type = getAssetType(file);
      if (!acceptedTypes.includes(type)) {
        toast.error(`Tipo de arquivo não aceito: ${file.name}`);
        continue;
      }
      await upload({ file, type, projectId });
    }
    
    e.target.value = '';
    onUploadComplete?.();
    
    setTimeout(() => setShowProgress(false), 2000);
  }, [upload, projectId, acceptedTypes, onUploadComplete]);

  const progressEntries = Object.entries(uploadProgress);
  const hasProgress = progressEntries.length > 0;

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        className="relative overflow-hidden"
        disabled={isUploading}
      >
        <input
          type="file"
          multiple
          accept={getAcceptString()}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Fazer Upload
          </>
        )}
      </Button>

      {/* Progress Display */}
      {showProgress && hasProgress && (
        <div className="mt-2 space-y-2">
          {progressEntries.map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[200px]">{fileName}</span>
                <span className="text-muted-foreground">
                  {progress.status === 'completed' && '✓'}
                  {progress.status === 'error' && '✗'}
                  {progress.status === 'uploading' && `${progress.progress}%`}
                </span>
              </div>
              {progress.status === 'uploading' && (
                <Progress value={progress.progress} className="h-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
