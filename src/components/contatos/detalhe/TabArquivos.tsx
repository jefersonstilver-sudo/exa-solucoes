import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  File, Plus, Upload, Download, Trash2, 
  FileText, FileImage, FileArchive, Eye 
} from 'lucide-react';
import { Contact, ContactFile } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TabArquivosProps {
  contact: Contact;
}

export const TabArquivos: React.FC<TabArquivosProps> = ({ contact }) => {
  const [files, setFiles] = useState<ContactFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [contact.id]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_files')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles((data as ContactFile[]) || []);
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Upload para storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${contact.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contact-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('contact-files')
        .getPublicUrl(fileName);

      // Salvar no banco
      const { error: dbError } = await supabase
        .from('contact_files')
        .insert({
          contact_id: contact.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          category: 'outros'
        });

      if (dbError) throw dbError;

      toast.success('Arquivo enviado com sucesso');
      fetchFiles();
    } catch (error: any) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error(error.message || 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('contact_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      toast.success('Arquivo removido');
      fetchFiles();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover arquivo');
    }
  };

  const getFileIcon = (type?: string) => {
    if (type?.startsWith('image/')) return FileImage;
    if (type?.includes('pdf') || type?.includes('document')) return FileText;
    if (type?.includes('zip') || type?.includes('rar')) return FileArchive;
    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Header com Upload */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <File className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium">Arquivos & Documentos</p>
                <p className="text-xs text-muted-foreground">{files.length} arquivo(s)</p>
              </div>
            </div>
            <label>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button size="sm" className="h-8" disabled={uploading} asChild>
                <span>
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  {uploading ? 'Enviando...' : 'Upload'}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum arquivo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Faça upload de documentos, propostas, contratos
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {file.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {formatDistanceToNow(new Date(file.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(file.file_url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = file.file_url;
                          link.download = file.file_name;
                          link.click();
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabArquivos;
