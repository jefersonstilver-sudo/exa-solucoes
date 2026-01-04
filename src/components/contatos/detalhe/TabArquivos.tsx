import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FolderOpen, Upload, Search, Grid, List, CloudUpload
} from 'lucide-react';
import { Contact, ContactFile } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileCard, StorageIndicator } from './ui';

interface TabArquivosProps {
  contact: Contact;
}

export const TabArquivos: React.FC<TabArquivosProps> = ({ contact }) => {
  const [files, setFiles] = useState<ContactFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${contact.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contact-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contact-files')
        .getPublicUrl(fileName);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'pdf' && file.file_type?.includes('pdf')) ||
      (filterType === 'image' && file.file_type?.startsWith('image/')) ||
      (filterType === 'spreadsheet' && (file.file_type?.includes('spreadsheet') || file.file_type?.includes('excel'))) ||
      (filterType === 'other' && !file.file_type?.includes('pdf') && !file.file_type?.startsWith('image/') && !file.file_type?.includes('spreadsheet'));
    return matchesSearch && matchesType;
  });

  const totalSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0);
  const maxSize = 500 * 1024 * 1024; // 500MB limit

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Biblioteca de Documentos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gerencie todos os arquivos e documentos deste contato
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-48">
                <StorageIndicator usedBytes={totalSize} totalBytes={maxSize} />
              </div>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Enviando...' : 'Upload'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-gray-50 border-0"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 h-9 bg-gray-50 border-0">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="spreadsheet">Planilha</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-none ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-none ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-purple-500' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600">
          Arraste arquivos aqui ou <span className="font-medium text-purple-600">clique para selecionar</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, Imagens, Planilhas até 50MB
        </p>
      </div>

      {/* Files Grid */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum arquivo encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {files.length === 0 
                  ? 'Faça upload de documentos, propostas, contratos'
                  : 'Tente buscar com outros termos'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
              : 'space-y-2'
            }>
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  id={file.id}
                  name={file.file_name}
                  type={file.file_type || ''}
                  size={file.file_size || 0}
                  createdAt={new Date(file.created_at)}
                  onView={() => window.open(file.file_url, '_blank')}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = file.file_url;
                    link.download = file.file_name;
                    link.click();
                  }}
                  onDelete={() => handleDelete(file.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabArquivos;
