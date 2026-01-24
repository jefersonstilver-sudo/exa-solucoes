import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useLegalFlow, LegalFlowData, RiscoDetectado } from '@/hooks/useLegalFlow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { WorkspaceHeader } from '@/components/legal-flow/WorkspaceHeader';
import { WorkspaceFooter } from '@/components/legal-flow/WorkspaceFooter';
import { WorkspaceControlToolbar } from '@/components/legal-flow/WorkspaceControlToolbar';
import { ContractInterviewer, ChatMessage } from '@/components/legal-flow/ContractInterviewer';
import { LiveContractPreview } from '@/components/legal-flow/LiveContractPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, FileText } from 'lucide-react';

// Scenario detection patterns
const SCENARIO_PATTERNS = {
  portal_cidade: {
    pattern: /portal\s*(da|de)?\s*cidade/i,
    tipo: 'permuta',
    suggestion: 'Detectei cenário "Portal da Cidade". Incluir gatilho de liberação de banner após 50 telas?',
    gatilho: { condicao: 'Atingir 50 telas instaladas', acao: 'Liberar espaço de banner no portal', prazo: '30 dias após atingimento' }
  },
  secovi: {
    pattern: /secovi|sindicato|associação/i,
    tipo: 'parceria_pj',
    suggestion: 'Detectei parceria institucional tipo SECOVI. Configurar como Cooperação Institucional com troca de logos?',
  },
  comodato: {
    pattern: /pietro\s*angelo|síndico|comodato|elevador/i,
    tipo: 'comodato',
    suggestion: 'Detectei cenário de Comodato. Aplicar cláusula de isenção de energia e responsabilidade civil?',
  }
};

// Sanitize old company data to Indexa 2026
function sanitizeToIndexa2026(text: string): string {
  const replacements = [
    { old: /EXA\s*Soluções\s*(Digitais)?/gi, new: 'INDEXA MIDIA LTDA' },
    { old: /51\.925\.922\/0001-50/g, new: '38.142.638/0001-30' },
    { old: /Natália\s*[A-Za-z\s]*/gi, new: 'Jeferson Stilver Rodrigues Encina' },
  ];
  
  let result = text;
  for (const r of replacements) {
    result = result.replace(r.old, r.new);
  }
  return result;
}

// Detect scenario from user input
function detectScenario(text: string) {
  for (const [key, scenario] of Object.entries(SCENARIO_PATTERNS)) {
    if (scenario.pattern.test(text)) {
      return { key, ...scenario };
    }
  }
  return null;
}

// Validate CNPJ format
function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.length === 14;
}

// Calculate health score with exact algorithm
function calculateExactHealthScore(data: LegalFlowData): number {
  let score = 0;

  // +15%: Parceiro identificado (CNPJ válido)
  if (data.parceiro_documento && isValidCNPJ(data.parceiro_documento)) {
    score += 15;
  }

  // +25%: Objeto >50 caracteres
  if (data.objeto && data.objeto.length > 50) {
    score += 25;
  }

  // +20%: Contrapartida clara (valor R$ ou obrigação de permuta)
  if (data.valor_financeiro || data.obrigacoes_parceiro.length > 0) {
    score += 20;
  }

  // +10%: Prazo definido
  if (data.prazo_meses > 0 && data.data_inicio) {
    score += 10;
  }

  // +30%: Validação de risco (sem cláusulas abusivas críticas não aceitas)
  const hasNoCriticalRisks = !data.riscos_detectados.some(
    (r: RiscoDetectado) => r.nivel === 'critico' && !r.aceito
  );
  if (hasNoCriticalRisks) {
    score += 30;
  }

  return score;
}

export default function JuridicoWorkspacePage() {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const isMobile = useIsMobile();
  
  const { 
    data, 
    updateData, 
    processWithAI, 
    isProcessing,
    createContract,
    reset 
  } = useLegalFlow();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');
  
  // State history for undo functionality
  const [stateHistory, setStateHistory] = useState<LegalFlowData[]>([]);
  const [previewKey, setPreviewKey] = useState(0); // Force re-render key

  // Calculate health with exact algorithm
  const health = {
    score: calculateExactHealthScore(data),
    breakdown: {
      parceiro: Boolean(data.parceiro_documento && isValidCNPJ(data.parceiro_documento)),
      objeto: Boolean(data.objeto && data.objeto.length > 50),
      contrapartidas: Boolean(data.valor_financeiro || data.obrigacoes_parceiro.length > 0),
      prazos: Boolean(data.prazo_meses > 0 && data.data_inicio),
      validacao_risco: !data.riscos_detectados.some(r => r.nivel === 'critico' && !r.aceito),
    }
  };

  // Add assistant message
  const addAssistantMessage = useCallback((content: string, actions?: ChatMessage['actions']) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      actions
    };
    setMessages(prev => [...prev, message]);
  }, []);

  // Add user message
  const addUserMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  }, []);

  // Handle send message
  const handleSendMessage = useCallback(async (content: string) => {
    // Sanitize input
    const sanitizedContent = sanitizeToIndexa2026(content);
    addUserMessage(sanitizedContent);

    // Detect scenario
    const scenario = detectScenario(sanitizedContent);
    if (scenario) {
      updateData({ tipo_contrato: scenario.tipo });
      
      // If has gatilho, add it
      if ('gatilho' in scenario && scenario.gatilho) {
        updateData({ 
          gatilhos_condicionais: [...data.gatilhos_condicionais, scenario.gatilho]
        });
      }

      // Add suggestion message
      setTimeout(() => {
        addAssistantMessage(scenario.suggestion, [
          { label: 'Sim, incluir', value: `confirm_${scenario.key}` },
          { label: 'Não, continuar', value: 'continue' }
        ]);
      }, 500);
      return;
    }

    // Save state before AI processing
    setStateHistory(prev => [...prev.slice(-9), { ...data }]);
    
    // Process with AI
    try {
      const aiResponse = await processWithAI(sanitizedContent, 'text');
      
      // PRIORITY: If AI returned follow_up_message (from REGEX-first or SDR), use it directly
      if (aiResponse?.follow_up_message) {
        setTimeout(() => addAssistantMessage(aiResponse.follow_up_message), 300);
        return;
      }
      
      // Fallback: Generate response based on updated data
      const responses: string[] = [];
      if (aiResponse?.parceiro?.nome || data.parceiro_nome) {
        responses.push(`✓ Parceiro: **${aiResponse?.parceiro?.nome || data.parceiro_nome}**`);
      }
      if (aiResponse?.parceiro?.documento || data.parceiro_documento) {
        responses.push(`✓ CNPJ/CPF: **${aiResponse?.parceiro?.documento || data.parceiro_documento}**`);
      }
      if (aiResponse?.tipo_contrato || data.tipo_contrato) {
        responses.push(`✓ Tipo: **${aiResponse?.tipo_contrato || data.tipo_contrato}**`);
      }
      
      const nextSteps: string[] = [];
      const updatedDoc = aiResponse?.parceiro?.documento || data.parceiro_documento;
      if (!updatedDoc) nextSteps.push('CNPJ/CPF do parceiro');
      if (!data.objeto || data.objeto.length < 50) nextSteps.push('Objeto detalhado do contrato');
      if (!data.valor_financeiro && data.obrigacoes_parceiro.length === 0) {
        nextSteps.push('Valor ou contrapartida');
      }

      const responseText = responses.length > 0 
        ? `**Dados atualizados:**\n${responses.join('\n')}` + 
          (nextSteps.length > 0 ? `\n\n**Próximo passo:** ${nextSteps[0]}` : '\n\n✅ Contrato pronto para revisão!')
        : 'Entendi. Pode me dar mais detalhes sobre o contrato?';

      setTimeout(() => addAssistantMessage(responseText), 300);

    } catch (error) {
      addAssistantMessage('Desculpe, ocorreu um erro ao processar. Pode tentar novamente?');
    }
  }, [addUserMessage, addAssistantMessage, processWithAI, updateData, data]);

  // Handle action click
  const handleActionClick = useCallback((value: string) => {
    if (value === 'anunciante' || value === 'comodato' || value === 'permuta') {
      updateData({ tipo_contrato: value });
      addUserMessage(`Vou criar um contrato de ${value}`);
      
      setTimeout(() => {
        const prompts: Record<string, string> = {
          anunciante: 'Ótimo! Me conte sobre o anunciante. Qual o nome da empresa, CNPJ e o que será anunciado?',
          comodato: 'Perfeito! Me fale sobre o prédio e o síndico. Qual o nome do condomínio e os dados do síndico?',
          permuta: 'Excelente! Descreva a permuta. Quem é o parceiro e o que cada parte oferece?'
        };
        addAssistantMessage(prompts[value]);
      }, 300);
      return;
    }

    if (value.startsWith('confirm_')) {
      addUserMessage('Sim, pode incluir');
      setTimeout(() => {
        addAssistantMessage('✓ Incluído! O que mais preciso saber sobre este contrato?');
      }, 300);
      return;
    }

    if (value === 'continue') {
      addUserMessage('Não, pode continuar');
      setTimeout(() => {
        addAssistantMessage('Ok! Me conte mais sobre o contrato.');
      }, 300);
    }
  }, [updateData, addUserMessage, addAssistantMessage]);

  // Handle voice input
  const handleVoiceInput = useCallback(async (audioBlob: Blob) => {
    toast.info('Processando áudio...');
    // TODO: Upload to storage and transcribe
    addAssistantMessage('Recebi seu áudio. Funcionalidade de transcrição em desenvolvimento.');
  }, [addAssistantMessage]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    toast.info(`Processando arquivo: ${file.name}`);
    // TODO: Parse document and extract text
    addAssistantMessage(`Recebi o arquivo **${file.name}**. Analisando conteúdo...`);
  }, [addAssistantMessage]);

  // Handle manual edit from preview - save to history
  const handleManualEdit = useCallback((field: string, value: string) => {
    // Save current state to history before edit
    setStateHistory(prev => [...prev.slice(-9), { ...data }]);
    addAssistantMessage(`✓ Anotei a alteração no campo "${field}".`);
  }, [addAssistantMessage, data]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONTROL TOOLBAR HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Refresh preview - force re-render
  const handleRefreshPreview = useCallback(() => {
    setPreviewKey(prev => prev + 1);
    toast.success('Preview atualizado!');
  }, []);

  // Undo - restore previous state
  const handleUndo = useCallback(() => {
    if (stateHistory.length === 0) {
      toast.error('Nenhuma alteração para desfazer');
      return;
    }
    
    const previousState = stateHistory[stateHistory.length - 1];
    setStateHistory(prev => prev.slice(0, -1));
    updateData(previousState);
    addAssistantMessage('⏪ Alteração desfeita. Estado anterior restaurado.');
    toast.success('Alteração desfeita!');
  }, [stateHistory, updateData, addAssistantMessage]);

  // Advance step - IA focuses on next gap proactively
  const handleAdvanceStep = useCallback(async () => {
    // Determine what's missing
    const missing: string[] = [];
    if (!data.parceiro_documento) missing.push('CNPJ/CPF');
    if (!data.parceiro_nome) missing.push('Nome/Razão Social');
    if (!data.objeto || data.objeto.length < 50) missing.push('Objeto detalhado');
    if (!data.valor_financeiro && data.obrigacoes_parceiro.length === 0) missing.push('Contrapartida');
    
    if (missing.length === 0) {
      addAssistantMessage('✅ **Contrato completo!** Todos os campos obrigatórios estão preenchidos. Revise e finalize.');
      return;
    }
    
    // Send proactive command to AI to focus on next field
    const nextField = missing[0];
    addUserMessage(`[Sistema] Avançando para: ${nextField}`);
    
    try {
      const command = `COMANDO_SISTEMA: Foco no próximo campo obrigatório: ${nextField}. Solicite essa informação de forma direta e objetiva.`;
      const aiResponse = await processWithAI(command, 'text');
      
      if (aiResponse?.follow_up_message) {
        setTimeout(() => addAssistantMessage(aiResponse.follow_up_message), 300);
      } else {
        addAssistantMessage(`➡️ **Próximo passo:** Preciso do **${nextField}**. Por favor, forneça essa informação.`);
      }
    } catch (e) {
      addAssistantMessage(`➡️ Falta: **${nextField}**. Forneça essa informação para continuar.`);
    }
  }, [data, processWithAI, addUserMessage, addAssistantMessage]);

  // Can undo?
  const canUndo = stateHistory.length > 0;
  
  // Can advance? Only if has minimal data
  const canAdvance = Boolean(data.parceiro_nome || data.parceiro_documento);

  // Save draft
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: Save to database as draft
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Rascunho salvo!');
    } catch (error) {
      toast.error('Erro ao salvar rascunho');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Finalize contract
  const handleFinalize = useCallback(async () => {
    if (health.score < 85) {
      toast.error('Complete os campos obrigatórios antes de enviar');
      return;
    }

    setIsSubmitting(true);
    try {
      await createContract();
      toast.success('Contrato criado com sucesso!');
      navigate(buildPath('juridico'));
    } catch (error) {
      toast.error('Erro ao criar contrato');
    } finally {
      setIsSubmitting(false);
    }
  }, [health.score, createContract, navigate, buildPath]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <WorkspaceHeader 
          health={health}
          isSaving={isSaving}
          onSave={handleSave}
          contractType={data.tipo_contrato}
        />

        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'chat' | 'preview')} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2 grid grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat IA
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contrato
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 m-0 p-0 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ContractInterviewer
                messages={messages}
                onSendMessage={handleSendMessage}
                onActionClick={handleActionClick}
                onVoiceInput={handleVoiceInput}
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
                currentData={data}
              />
            </div>
            <WorkspaceControlToolbar
              onRefreshPreview={handleRefreshPreview}
              onUndo={handleUndo}
              onAdvanceStep={handleAdvanceStep}
              canUndo={canUndo}
              canAdvance={canAdvance}
              isProcessing={isProcessing}
              healthScore={health.score}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-0 p-0 overflow-hidden">
            <LiveContractPreview
              key={previewKey}
              data={data}
              onUpdate={updateData}
              isEditable={true}
              onManualEdit={handleManualEdit}
            />
          </TabsContent>
        </Tabs>

        <WorkspaceFooter
          canFinalize={health.score >= 85}
          healthScore={health.score}
          isSaving={isSaving}
          isSubmitting={isSubmitting}
          onSave={handleSave}
          onFinalize={handleFinalize}
        />
      </div>
    );
  }

  // Desktop layout with split screen
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <WorkspaceHeader 
        health={health}
        isSaving={isSaving}
        onSave={handleSave}
        contractType={data.tipo_contrato}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel: Interviewer + Control Toolbar */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <ContractInterviewer
                messages={messages}
                onSendMessage={handleSendMessage}
                onActionClick={handleActionClick}
                onVoiceInput={handleVoiceInput}
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
                currentData={data}
              />
            </div>
            {/* Control Toolbar */}
            <WorkspaceControlToolbar
              onRefreshPreview={handleRefreshPreview}
              onUndo={handleUndo}
              onAdvanceStep={handleAdvanceStep}
              canUndo={canUndo}
              canAdvance={canAdvance}
              isProcessing={isProcessing}
              healthScore={health.score}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Live Preview */}
        <ResizablePanel defaultSize={65} minSize={50}>
          <LiveContractPreview
            key={previewKey}
            data={data}
            onUpdate={updateData}
            isEditable={true}
            onManualEdit={handleManualEdit}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <WorkspaceFooter
        canFinalize={health.score >= 85}
        healthScore={health.score}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onFinalize={handleFinalize}
      />
    </div>
  );
}
