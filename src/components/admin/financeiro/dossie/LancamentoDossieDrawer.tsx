/**
 * LancamentoDossieDrawer - Container principal do Dossiê Financeiro
 * Drawer lateral premium com 7 abas de funcionalidade
 */

import React, { useState, useCallback } from 'react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  FileText, 
  Tag, 
  Paperclip, 
  MessageSquare, 
  Mic, 
  Link2, 
  History 
} from 'lucide-react';

import DossieHeader from './DossieHeader';
import TabResumo from './tabs/TabResumo';
import TabCategorizacao from './tabs/TabCategorizacao';
import TabComprovantes from './tabs/TabComprovantes';
import TabObservacoes from './tabs/TabObservacoes';
import TabAudio from './tabs/TabAudio';
import TabOrigem from './tabs/TabOrigem';
import TabHistorico from './tabs/TabHistorico';

import { useLancamentoDossie } from './hooks/useLancamentoDossie';
import { useComprovantes } from './hooks/useComprovantes';
import { LancamentoDossie, LancamentoTipo } from './types';

interface LancamentoDossieDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamento: LancamentoDossie | null;
  onUpdate?: () => void;
}

const LancamentoDossieDrawer: React.FC<LancamentoDossieDrawerProps> = ({
  open,
  onOpenChange,
  lancamento,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState('resumo');
  const [localLancamento, setLocalLancamento] = useState<LancamentoDossie | null>(lancamento);

  // Determine lancamento type
  const getLancamentoTipo = (): LancamentoTipo | null => {
    if (!lancamento) return null;
    if (lancamento.origem === 'asaas') return 'asaas';
    if (lancamento.origem === 'asaas_saida') return 'asaas_saida';
    return 'despesa';
  };

  const lancamentoId = lancamento?.origem_id || lancamento?.id || null;
  const lancamentoTipo = getLancamentoTipo();

  const {
    loading,
    saving,
    comprovantes,
    observacoes,
    audios,
    historico,
    categorias,
    subcategorias,
    centrosCusto,
    funcionarios,
    updateMetadata,
    addObservacao,
    logHistorico,
    refresh
  } = useLancamentoDossie({ lancamentoId, lancamentoTipo });

  const {
    uploading,
    deleting,
    uploadComprovante,
    deleteComprovante
  } = useComprovantes({
    lancamentoId,
    lancamentoTipo,
    onUpdate: refresh,
    logHistorico
  });

  // Update React state when drawer opens with new lancamento
  React.useEffect(() => {
    if (lancamento) {
      setLocalLancamento(lancamento);
      setActiveTab('resumo');
    }
  }, [lancamento]);

  const handleConciliar = useCallback(async () => {
    if (!localLancamento) return;
    
    const success = await updateMetadata(
      { conciliado: !localLancamento.conciliado },
      localLancamento
    );
    
    if (success) {
      setLocalLancamento(prev => prev ? { ...prev, conciliado: !prev.conciliado } : null);
      onUpdate?.();
    }
  }, [localLancamento, updateMetadata, onUpdate]);

  const handleSaveCategorizacao = useCallback(async (updates: Partial<LancamentoDossie>) => {
    if (!localLancamento) return false;
    
    const success = await updateMetadata(updates, localLancamento);
    if (success) {
      setLocalLancamento(prev => prev ? { ...prev, ...updates } : null);
      onUpdate?.();
    }
    return success;
  }, [localLancamento, updateMetadata, onUpdate]);

  const handleUploadAudio = useCallback(async (blob: Blob, duracao: number) => {
    // TODO: Implement audio upload
    return false;
  }, []);

  const handleDeleteAudio = useCallback(async () => {
    // TODO: Implement audio delete
    return false;
  }, []);

  if (!localLancamento) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] sm:max-w-2xl">
        {/* Fixed Header */}
        <DossieHeader
          lancamento={localLancamento}
          onClose={() => onOpenChange(false)}
          onConciliar={handleConciliar}
          saving={saving}
        />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-gray-50/50 px-4">
            <TabsList className="h-12 w-full justify-start gap-1 bg-transparent p-0 overflow-x-auto">
              <TabsTrigger value="resumo" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="categorizacao" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Categorização</span>
              </TabsTrigger>
              <TabsTrigger value="comprovantes" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 relative">
                <Paperclip className="h-4 w-4" />
                <span className="hidden sm:inline">Comprovantes</span>
                {comprovantes.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {comprovantes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="observacoes" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 relative">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Obs</span>
                {observacoes.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {observacoes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="audio" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Áudio</span>
              </TabsTrigger>
              <TabsTrigger value="origem" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Origem</span>
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="resumo" className="m-0 h-full">
              <TabResumo lancamento={localLancamento} />
            </TabsContent>

            <TabsContent value="categorizacao" className="m-0 h-full">
              <TabCategorizacao
                lancamento={localLancamento}
                categorias={categorias}
                subcategorias={subcategorias}
                centrosCusto={centrosCusto}
                funcionarios={funcionarios}
                onSave={handleSaveCategorizacao}
                saving={saving}
              />
            </TabsContent>

            <TabsContent value="comprovantes" className="m-0 h-full">
              <TabComprovantes
                comprovantes={comprovantes}
                uploading={uploading}
                deleting={deleting}
                onUpload={uploadComprovante}
                onDelete={deleteComprovante}
              />
            </TabsContent>

            <TabsContent value="observacoes" className="m-0 h-full">
              <TabObservacoes
                observacoes={observacoes}
                onAdd={addObservacao}
              />
            </TabsContent>

            <TabsContent value="audio" className="m-0 h-full">
              <TabAudio
                audios={audios}
                onUpload={handleUploadAudio}
                onDelete={handleDeleteAudio}
              />
            </TabsContent>

            <TabsContent value="origem" className="m-0 h-full">
              <TabOrigem
                lancamento={localLancamento}
                onConciliar={handleConciliar}
                onReconciliar={handleConciliar}
                saving={saving}
              />
            </TabsContent>

            <TabsContent value="historico" className="m-0 h-full">
              <TabHistorico historico={historico} />
            </TabsContent>
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

export default LancamentoDossieDrawer;
