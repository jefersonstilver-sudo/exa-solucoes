import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentUploadProps {
  label: string;
  value?: string;
  onChange: (url: string | null) => void;
  bucketName?: string;
  folder?: string;
  accept?: string;
  disabled?: boolean;
}

const DocumentUpload = ({
  label,
  value,
  onChange,
  bucketName = 'documents',
  folder = 'user-documents',
  accept = 'image/*,application/pdf',
  disabled = false
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho do arquivo (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 100MB.');
      return;
    }

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      onChange(data.publicUrl);
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const getFileTypeIcon = (url?: string) => {
    if (!url) return null;
    const isPdf = url.toLowerCase().includes('.pdf');
    return isPdf ? '📄' : '🖼️';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <span className="text-2xl">{getFileTypeIcon(value)}</span>
          <div className="flex-1 text-sm text-gray-600">
            Documento enviado
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open(value, '_blank')}
            className="h-8"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="h-8 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            onChange={handleFileUpload}
            accept={accept}
            disabled={uploading || disabled}
            className="hidden"
            id={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
            className="cursor-pointer"
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {uploading ? 'Enviando...' : 'Clique para enviar documento'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG ou PDF até 100MB
            </p>
          </label>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;