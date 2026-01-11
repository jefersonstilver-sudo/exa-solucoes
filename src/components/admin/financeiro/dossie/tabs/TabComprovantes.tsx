/**
 * TabComprovantes - Upload e gestão de comprovantes
 * Suporta PDF, imagens com preview e metadados
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Download,
  Eye,
  X,
  Loader2,
  File
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Comprovante } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TabComprovantesProps {
  comprovantes: Comprovante[];
  uploading: boolean;
  deleting: string | null;
  onUpload: (file: File, tipo: Comprovante['tipo_comprovante'], obs?: string) => Promise<boolean>;
  onDelete: (comprovante: Comprovante) => Promise<boolean>;
}

const TIPOS_COMPROVANTE: { value: Comprovante['tipo_comprovante']; label: string }[] = [
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'comprovante_pix', label: 'Comprovante PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outro', label: 'Outro' },
];

const TabComprovantes: React.FC<TabComprovantesProps> = ({
  comprovantes,
  uploading,
  deleting,
  onUpload,
  onDelete
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoComprovante, setTipoComprovante] = useState<Comprovante['tipo_comprovante']>('outro');
  const [observacao, setObservacao] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadForm(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const success = await onUpload(selectedFile, tipoComprovante, observacao);
    if (success) {
      setShowUploadForm(false);
      setSelectedFile(null);
      setTipoComprovante('outro');
      setObservacao('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePreview = (comprovante: Comprovante) => {
    const isImage = comprovante.arquivo_url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = comprovante.arquivo_url.match(/\.pdf$/i);
    
    setPreviewUrl(comprovante.arquivo_url);
    setPreviewType(isImage ? 'image' : isPdf ? 'pdf' : null);
  };

  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (url.match(/\.pdf$/i)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getTipoLabel = (tipo: Comprovante['tipo_comprovante']) => {
    return TIPOS_COMPROVANTE.find(t => t.value === tipo)?.label || tipo;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Upload area */}
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {!showUploadForm ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50/50 transition-all group"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Upload className="h-5 w-5 text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Clique para anexar comprovante
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF ou imagem (até 100MB)
                </p>
              </div>
            </div>
          </button>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile?.name || '')}
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile?.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedFile && Math.round(selectedFile.size / 1024)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">Tipo de Comprovante</Label>
                <Select value={tipoComprovante} onValueChange={(v) => setTipoComprovante(v as any)}>
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_COMPROVANTE.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Observação (opcional)</Label>
                <Textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Adicione uma observação..."
                  className="mt-1 bg-white resize-none"
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Anexar Comprovante
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* List of attachments */}
      {comprovantes.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Comprovantes Anexados ({comprovantes.length})
          </h3>
          
          <div className="space-y-2">
            {comprovantes.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
              >
                {getFileIcon(comp.arquivo_url)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {comp.arquivo_nome || 'Arquivo'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{getTipoLabel(comp.tipo_comprovante)}</span>
                    <span>•</span>
                    <span>{format(new Date(comp.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
                    {comp.uploaded_by_nome && (
                      <>
                        <span>•</span>
                        <span>{comp.uploaded_by_nome}</span>
                      </>
                    )}
                  </div>
                  {comp.observacao && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{comp.observacao}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePreview(comp)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a href={comp.arquivo_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(comp)}
                    disabled={deleting === comp.id}
                  >
                    {deleting === comp.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhum comprovante anexado</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Comprovante</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {previewType === 'image' && previewUrl && (
              <img 
                src={previewUrl} 
                alt="Comprovante" 
                className="max-w-full h-auto mx-auto rounded-lg"
              />
            )}
            {previewType === 'pdf' && previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] rounded-lg"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TabComprovantes;
