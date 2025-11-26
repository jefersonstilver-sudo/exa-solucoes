import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface AvatarUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  userName?: string;
  disabled?: boolean;
}
const AvatarUpload = ({
  value,
  onChange,
  userName = 'Usuario',
  disabled = false
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validar tamanho do arquivo (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.');
      return;
    }
    try {
      setUploading(true);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar/${Date.now()}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      onChange(data.publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };
  const handleRemove = () => {
    onChange(null);
  };
  return <div className="space-y-4">
      <Label>Foto de Perfil</Label>
      
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20 border-2 border-gray-200">
          <AvatarImage src={value} alt="Avatar" />
          <AvatarFallback className="text-lg font-semibold">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col space-y-2">
          <input type="file" onChange={handleFileUpload} accept="image/*" disabled={uploading || disabled} className="hidden" id="avatar-upload" />
          <label htmlFor="avatar-upload">
            <Button type="button" variant="outline" size="sm" disabled={uploading || disabled} asChild>
              <span className="cursor-pointer">
                {uploading ? <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </> : <>
                    <Camera className="h-4 w-4 mr-2" />
                    {value ? 'Alterar Foto' : 'Adicionar Foto'}
                  </>}
              </span>
            </Button>
          </label>
          
          {value && <Button type="button" variant="outline" size="sm" onClick={handleRemove} disabled={disabled} className="text-red-600 hover:text-red-700">
              <X className="h-4 w-4 mr-2" />
              Remover
            </Button>}
        </div>
      </div>
      
      
    </div>;
};
export default AvatarUpload;