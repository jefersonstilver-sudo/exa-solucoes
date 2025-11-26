import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, User, Phone, Bot, Flame, AlertTriangle, Plus, FileText, Sparkles, BarChart3 } from 'lucide-react';
import { useLeadDetails } from '../../hooks/useLeadDetails';
import { useContactTypes } from '../../hooks/useContactTypes';
import { useLeadProfile } from '../../hooks/useLeadProfile';
import { useLeadMetricsDetailed, type PeriodType } from '../../hooks/useLeadMetricsDetailed';
import { useConversationContext } from '../../hooks/useConversationContext';
import { ConversationNotes } from './ConversationNotes';
import { ConversationTags } from './ConversationTags';
import { ContactTypeManager } from './ContactTypeManager';
import { ConversationReportViewer } from './ConversationReportViewer';
import { LeadAnalysisSection } from './LeadAnalysisSection';
import { ConversationReports } from './ConversationReports';
import { LastContextCard } from './details/LastContextCard';
import { MetricCards } from './details/MetricCards';
import { FilterBar } from './details/FilterBar';
import { formatContactNameWithBuilding } from '../../utils/contactFormatters';
import { cn } from '@/lib/utils';

interface LeadDetailModalProps {
  conversationId: string | null;
  open: boolean;
  onClose: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  conversationId,
  open,
  onClose
}) => {
  const { lead, metrics, loading, updateLeadType, updateLeadScore, toggleSindico, toggleHotLead, generateReport } = useLeadDetails(conversationId);
  const { contactTypes, refetch: refetchContactTypes } = useContactTypes();
  const { profile, saveFromReport } = useLeadProfile(conversationId);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Estados para métricas detalhadas e filtros
  const [period, setPeriod] = useState<PeriodType>('today');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  const [selectedAgent, setSelectedAgent] = useState<string>('auto');

  // Hook de contexto inteligente
  const conversationContext = useConversationContext(
    conversationId, 
    lead?.contact_type || null
  );

  const detailedMetrics = useLeadMetricsDetailed(
    conversationId,
    period,
    customStart,
    customEnd
  );

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    const data = await generateReport();
    if (data) {
      setReportData(data);
      setShowReport(true);
      await saveFromReport(data);
    }
    setGeneratingReport(false);
  };

  const handleSuggestedType = (type: string) => {
    updateLeadType(type);
  };

  if (!conversationId || !lead) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className={cn(
            // Desktop: Modal centralizado 70% x 85%
            "w-[70vw] max-w-6xl h-[85vh]",
            // Mobile: Fullscreen
            "sm:w-[70vw] sm:h-[85vh] max-sm:w-screen max-sm:h-screen max-sm:max-w-full max-sm:rounded-none",
            // Glass Premium
            "bg-white/70 dark:bg-neutral-900/55",
            "backdrop-blur-xl",
            "border border-white/20 dark:border-white/10",
            "shadow-2xl rounded-2xl max-sm:rounded-none",
            // Overflow
            "overflow-hidden flex flex-col"
          )}
        >
          <DialogHeader className="border-b border-white/10 px-6 py-4 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold">
                  Detalhes do Lead
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Análise completa e métricas inteligentes da conversa
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando detalhes...
              </div>
            ) : (
              <>
                {/* Header com Info Básica */}
                <div className="glass-card p-5 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {formatContactNameWithBuilding(
                          lead.contact_name,
                          lead.contact_phone,
                          lead.metadata?.building_name
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{lead.contact_phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bot className="w-4 h-4" />
                    Agente: <span className="font-medium">{lead.agent_key || 'Indefinido'}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {lead.is_hot_lead && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        Hot Lead
                      </Badge>
                    )}
                    {lead.is_critical && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Crítico
                      </Badge>
                    )}
                    {lead.is_sindico && (
                      <Badge variant="secondary">Síndico</Badge>
                    )}
                  </div>

                  {/* Tipo de Contato */}
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-sm font-medium">Tipo de Contato</Label>
                      {lead.contact_type_source === 'manual' ? (
                        <Badge variant="secondary" className="text-xs">
                          👤 Manual
                        </Badge>
                      ) : lead.contact_type_source === 'ai' ? (
                        <Badge variant="outline" className="text-xs">
                          🤖 IA
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={lead.contact_type || 'unknown'}
                        onValueChange={updateLeadType}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowTypeManager(true)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ÚLTIMO CONTEXTO - Card Principal */}
                <LastContextCard 
                  context={conversationContext}
                  currentContactType={lead.contact_type}
                  onSuggestType={handleSuggestedType}
                />

                {/* Filtros */}
                <FilterBar
                  selectedAgent={selectedAgent}
                  onAgentChange={setSelectedAgent}
                  period={period}
                  onPeriodChange={setPeriod}
                  customStart={customStart}
                  customEnd={customEnd}
                  onCustomDatesChange={(start, end) => {
                    setCustomStart(start);
                    setCustomEnd(end);
                  }}
                  currentAgentKey={lead.agent_key}
                />

                {/* Métricas Principais */}
                <MetricCards
                  totalSent={detailedMetrics.totalSent}
                  totalReceived={detailedMetrics.totalReceived}
                  avgResponseTimeAgent={detailedMetrics.avgResponseTimeAgent}
                  avgResponseTimeContact={detailedMetrics.avgResponseTimeContact}
                  loading={detailedMetrics.loading}
                />

                {/* Tabs: Análise IA e Outros */}
                <Tabs defaultValue="analysis" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Análise IA
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Admin
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="space-y-4 mt-4">
                    {/* Lead Score */}
                    <div className="glass-card p-4 rounded-xl space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        🎯 Lead Score
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Pontuação</Label>
                          <span className="text-sm font-medium">{lead.lead_score || 0}/100</span>
                        </div>
                        <Slider
                          value={[lead.lead_score || 0]}
                          onValueChange={(values) => updateLeadScore(values[0])}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Análise do Lead */}
                    <LeadAnalysisSection 
                      profile={profile}
                      detectedType={reportData?.detectedType}
                    />

                    {/* Relatórios */}
                    <div className="glass-card p-4 rounded-xl space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        📄 Relatórios da IA
                      </h4>
                      <Button 
                        onClick={handleGenerateReport} 
                        disabled={generatingReport}
                        className="w-full"
                        variant="default"
                      >
                        {generatingReport ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Gerando relatório...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Gerar Novo Relatório
                          </>
                        )}
                      </Button>
                      <ConversationReports conversationId={conversationId} />
                    </div>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-4 mt-4">
                    {/* Tags */}
                    <div className="glass-card p-4 rounded-xl">
                      <ConversationTags
                        phoneNumber={lead.contact_phone}
                        agentKey={lead.agent_key || 'unknown'}
                      />
                    </div>

                    {/* Notas */}
                    <div className="glass-card p-4 rounded-xl">
                      <ConversationNotes
                        phoneNumber={lead.contact_phone}
                        agentKey={lead.agent_key || 'unknown'}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento de Tipos */}
      <ContactTypeManager
        open={showTypeManager}
        onClose={() => {
          setShowTypeManager(false);
          refetchContactTypes();
        }}
      />

      {/* Visualizador de Relatório */}
      <ConversationReportViewer
        open={showReport}
        onClose={() => setShowReport(false)}
        conversationId={conversationId}
        reportData={reportData}
      />
    </>
  );
};
