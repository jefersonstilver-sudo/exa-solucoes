import { useState, useRef } from 'react';
import { Agent } from '../../hooks/useAgentConfig';
import { useKnowledgeBase } from '../../hooks/useKnowledgeBase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface KnowledgeBaseSectionProps {
  agents: Agent[];
}

export const KnowledgeBaseSection = ({ agents }: KnowledgeBaseSectionProps) => {
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>(agents[0]?.key || '');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { documents, loading, uploading, uploadDocument, deleteDocument, reprocessDocument } = useKnowledgeBase(selectedAgentKey);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!selectedAgentKey) {
      toast.error('Selecione um agente');
      return;
    }

    try {
      await uploadDocument(file, selectedAgentKey);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-500';
      case 'indexing': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-[#A0A0A0]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Pronto';
      case 'indexing': return 'Indexando';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-[14px] border border-[#2A2A2A] p-6">
      <h2 className="text-xl font-bold text-white mb-4">Base de Conhecimento</h2>

      <div className="mb-4">
        <Label className="text-white">Selecionar Agente</Label>
        <select
          value={selectedAgentKey}
          onChange={(e) => setSelectedAgentKey(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-md p-2 mt-1"
        >
          {agents.filter(a => a.type === 'ai').map(agent => (
            <option key={agent.key} value={agent.key}>
              {agent.display_name}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
          dragActive
            ? 'border-[#9C1E1E] bg-[#9C1E1E]/10'
            : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-[#A0A0A0] mx-auto mb-4" />
        <p className="text-white mb-2">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-sm text-[#A0A0A0] mb-4">
          Suporta: PDF, DOCX, TXT, MD
        </p>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-white font-medium mb-3">Documentos ({documents.length})</h3>
        
        {loading ? (
          <p className="text-[#A0A0A0] text-center py-8">Carregando...</p>
        ) : documents.length === 0 ? (
          <p className="text-[#A0A0A0] text-center py-8">
            Nenhum documento enviado ainda
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4 hover:border-[#3A3A3A] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-5 h-5 text-[#A0A0A0] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{doc.file_name}</p>
                    <div className="flex gap-3 mt-1 text-xs text-[#666]">
                      <span>{formatFileSize(doc.size)}</span>
                      <span className={getStatusColor(doc.status)}>
                        {getStatusText(doc.status)}
                      </span>
                      <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {doc.status === 'error' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => reprocessDocument(doc.id)}
                      title="Reprocessar"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteDocument(doc.id, doc.storage_path)}
                    className="text-red-400 hover:text-red-300"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
