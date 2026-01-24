import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LegalHealthGauge } from '@/components/legal-flow/LegalHealthGauge';
import { VoiceRecordButton } from '@/components/legal-flow/VoiceRecordButton';
import { RiskDetectedCard } from '@/components/legal-flow/RiskDetectedCard';
import { QuestionStep } from '@/components/legal-flow/QuestionStep';
import { MultimodalInput } from '@/components/legal-flow/MultimodalInput';
import { useLegalFlow } from '@/hooks/useLegalFlow';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = [
  { id: 'parceiro', question: 'Com quem você quer fazer um acordo?', subtitle: 'Digite, fale ou anexe um documento' },
  { id: 'tipo', question: 'Qual o tipo de contrato?', subtitle: 'Selecione a categoria que melhor se aplica' },
  { id: 'objeto', question: 'Qual é o objetivo principal?', subtitle: 'Descreva o que será acordado entre as partes' },
  { id: 'prazos', question: 'Qual o prazo ou vigência?', subtitle: 'Defina a duração do acordo' },
  { id: 'contrapartidas', question: 'Quais são as contrapartidas?', subtitle: 'O que cada parte oferece e recebe?' },
  { id: 'revisao', question: 'Revise os riscos detectados', subtitle: 'Confirme ou ajuste as sugestões da IA' },
];

const TIPOS_CONTRATO = [
  { value: 'termo_aceite', label: 'Termo de Aceite (Síndico)' },
  { value: 'comodato', label: 'Contrato de Comodato' },
  { value: 'anunciante', label: 'Contrato de Anunciante' },
  { value: 'parceria_clt', label: 'Parceria CLT' },
  { value: 'parceria_pj', label: 'Parceria PJ' },
  { value: 'permuta', label: 'Permuta' },
];

export default function LegalFlowPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const {
    data: flowData,
    updateData,
    health,
    isProcessing,
    processWithAI,
    acceptRiskSuggestion,
    createContract,
  } = useLegalFlow();

  const healthScore = health.score;
  const healthBreakdown = health.breakdown;
  const risks = flowData.riscos_detectados || [];

  const canContinue = () => {
    switch (STEPS[currentStep].id) {
      case 'parceiro':
        return flowData.parceiro_nome?.trim().length > 2;
      case 'tipo':
        return !!flowData.tipo_contrato;
      case 'objeto':
        return flowData.objeto?.trim().length > 10;
      case 'prazos':
        return flowData.prazo_meses > 0;
      case 'contrapartidas':
        return flowData.obrigacoes_indexa?.length > 0 || flowData.obrigacoes_parceiro?.length > 0;
      case 'revisao':
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateContract = async () => {
    if (healthScore < 80) {
      toast.error('Complete mais informações para gerar o contrato (mínimo 80%)');
      return;
    }

    try {
      await createContract();
      toast.success('Contrato gerado com sucesso!');
      navigate('/super_admin/juridico');
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleAISubmit = async (content: string, type: 'text' | 'audio_url' | 'document_text') => {
    await processWithAI(content, type);
  };

  const handleVoiceTranscription = (text: string) => {
    updateData({ parceiro_nome: text, modo_entrada: 'voz' });
  };

  const rejectRisk = (index: number) => {
    // Just mark as reviewed but not accepted
    // For now, we don't need special handling
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'parceiro':
        return (
          <div className="w-full max-w-lg space-y-6">
            <MultimodalInput
              onSubmit={handleAISubmit}
              isProcessing={isProcessing}
              placeholder="Ex: Portal da Cidade, SECOVI, João Silva..."
            />
            
            {flowData.parceiro_nome && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Tipo de Pessoa</label>
                  <Select
                    value={flowData.parceiro_tipo_pessoa || 'PJ'}
                    onValueChange={(value) => updateData({ parceiro_tipo_pessoa: value as 'PF' | 'PJ' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {flowData.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}
                  </label>
                  <Input
                    value={flowData.parceiro_documento || ''}
                    onChange={(e) => updateData({ parceiro_documento: e.target.value })}
                    placeholder={flowData.parceiro_tipo_pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>
              </motion.div>
            )}
          </div>
        );

      case 'tipo':
        return (
          <div className="w-full max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              {TIPOS_CONTRATO.map((tipo) => (
                <motion.button
                  key={tipo.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateData({ tipo_contrato: tipo.value })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    flowData.tipo_contrato === tipo.value
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      flowData.tipo_contrato === tipo.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {flowData.tipo_contrato === tipo.value && (
                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="font-medium">{tipo.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 'objeto':
        return (
          <div className="w-full max-w-lg space-y-4">
            <Textarea
              value={flowData.objeto || ''}
              onChange={(e) => updateData({ objeto: e.target.value })}
              placeholder="Descreva o objetivo do contrato... Ex: 'Parceria para exibição de conteúdo em telas de elevador em troca de espaço publicitário no site do parceiro'"
              className="min-h-[150px] text-lg"
            />
            <div className="flex items-center gap-2">
              <VoiceRecordButton
                onTranscriptionComplete={(text) => updateData({ objeto: (flowData.objeto || '') + ' ' + text })}
                variant="inline"
              />
              <span className="text-sm text-muted-foreground">ou dite o objetivo</span>
            </div>
          </div>
        );

      case 'prazos':
        return (
          <div className="w-full max-w-lg space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Prazo (meses)</label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={flowData.prazo_meses || ''}
                  onChange={(e) => updateData({ prazo_meses: parseInt(e.target.value) || 0 })}
                  placeholder="12"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Data de Início</label>
                <Input
                  type="date"
                  value={flowData.data_inicio || ''}
                  onChange={(e) => updateData({ data_inicio: e.target.value })}
                />
              </div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Para contratos de comodato com síndicos, o prazo padrão é de 24 meses com renovação automática.
              </p>
            </div>
          </div>
        );

      case 'contrapartidas':
        return (
          <div className="w-full max-w-lg space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">O que a INDEXA oferece?</label>
              <Textarea
                value={flowData.obrigacoes_indexa?.join('\n') || ''}
                onChange={(e) => updateData({ obrigacoes_indexa: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Uma obrigação por linha... Ex:&#10;Exibição de banner no elevador&#10;Manutenção do equipamento"
                className="min-h-[100px]"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">O que o PARCEIRO oferece?</label>
              <Textarea
                value={flowData.obrigacoes_parceiro?.join('\n') || ''}
                onChange={(e) => updateData({ obrigacoes_parceiro: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Uma obrigação por linha... Ex:&#10;Cessão de espaço para tela&#10;Fornecimento de energia elétrica"
                className="min-h-[100px]"
              />
            </div>

            {flowData.tipo_contrato === 'permuta' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Permuta detectada:</strong> Deseja adicionar um gatilho condicional? 
                  Ex: "Banner só após 50 telas instaladas"
                </p>
                <Textarea
                  value={flowData.gatilhos_condicionais?.[0]?.condicao || ''}
                  onChange={(e) => updateData({ 
                    gatilhos_condicionais: [{ condicao: e.target.value, acao: 'Liberar contrapartida' }] 
                  })}
                  placeholder="Descreva a condição (opcional)..."
                  className="mt-2 min-h-[60px]"
                />
              </div>
            )}
          </div>
        );

      case 'revisao':
        return (
          <div className="w-full max-w-lg space-y-4">
            {risks.length > 0 ? (
              risks.map((risk, index) => (
                <RiskDetectedCard
                  key={index}
                  nivel={risk.nivel}
                  descricao={risk.descricao}
                  sugestao={risk.sugestao}
                  aceito={risk.aceito}
                  onAccept={() => acceptRiskSuggestion(index)}
                  onReject={() => rejectRisk(index)}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-emerald-800">Nenhum risco detectado!</h3>
                <p className="text-sm text-emerald-600 mt-1">
                  O contrato está pronto para ser gerado.
                </p>
              </motion.div>
            )}

            {healthScore >= 80 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4"
              >
                <Button
                  onClick={handleGenerateContract}
                  disabled={isProcessing}
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando contrato...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Gerar Contrato
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/super_admin/juridico')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">EXA Legal Flow</h1>
              </div>
            </div>

            <LegalHealthGauge score={healthScore} breakdown={healthBreakdown} />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  index < currentStep
                    ? "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {index < currentStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
              </button>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "w-12 h-1 rounded-full transition-all",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <QuestionStep
              key={currentStep}
              question={STEPS[currentStep].question}
              subtitle={STEPS[currentStep].subtitle}
              onNext={handleNext}
              onPrev={handlePrev}
              canContinue={canContinue()}
              isFirst={currentStep === 0}
              isLast={currentStep === STEPS.length - 1}
              showAIBadge={isProcessing}
            >
              {renderStepContent()}
            </QuestionStep>
          </AnimatePresence>
        </div>
      </main>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">IA processando...</p>
              <p className="text-sm text-muted-foreground">Analisando dados e estruturando o contrato</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
