import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { 
  User, 
  Phone, 
  Bot, 
  Flame, 
  AlertTriangle, 
  Plus, 
  FileText, 
  Sparkles, 
  BarChart3, 
  RefreshCw, 
  Building2, 
  Tag, 
  Clock, 
  Calendar, 
  TrendingUp 
} from 'lucide-react';
import { useLeadDetails } from '../../hooks/useLeadDetails';
import { useContactTypes } from '../../hooks/useContactTypes';
import { useLeadProfile } from '../../hooks/useLeadProfile';
import { useLeadMetricsDetailed, type PeriodType } from '../../hooks/useLeadMetricsDetailed';
import { ConversationNotes } from './ConversationNotes';
import { ConversationTags } from './ConversationTags';
import { ContactTypeManager } from './ContactTypeManager';
import { ConversationReportViewer } from './ConversationReportViewer';
import { LeadAnalysisSection } from './LeadAnalysisSection';
import { ConversationReports } from './ConversationReports';
import { DateRangePicker } from './DateRangePicker';
import { LeadMetricsChart } from './LeadMetricsChart';
import { LeadMetricsCards } from './LeadMetricsCards';
import { formatContactNameWithBuilding } from '../../utils/contactFormatters';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LeadDetailDrawerProps {
  conversationId: string | null;
  open: boolean;
  onClose: () => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para métricas detalhadas
  const [period, setPeriod] = useState<PeriodType>('today');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Adicione lógica de refresh aqui se necessário
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!conversationId || !lead) {
    return null;
  }

  const leadName = formatContactNameWithBuilding(
    lead.contact_name,
    lead.contact_phone,
    lead.metadata?.building_name
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="exa-lead-modal max-w-[90vw] w-[900px] max-h-[90vh] p-0 overflow-hidden">
          {/* HEADER */}
          <DialogHeader className="px-6 py-4 border-b border-[var(--exa-border)] bg-[var(--exa-bg-primary)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold text-[var(--exa-text-primary)] truncate">
                  {leadName}
                </DialogTitle>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={lead.contact_type || 'unknown'}
                    onValueChange={updateLeadType}
                  >
                    <SelectTrigger className="w-[180px] h-8 bg-[var(--exa-bg-card)] border-[var(--exa-border)]">
                      <SelectValue placeholder="Tipo de contato" />
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
                    className="h-8 w-8 shrink-0"
                    onClick={() => setShowTypeManager(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="shrink-0"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
            
            {/* Informações rápidas no header */}
            <div className="flex items-center gap-4 mt-3 text-sm text-[var(--exa-text-secondary)]">
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>{lead.contact_phone}</span>
              </div>
              {lead.metadata?.building_name && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>{lead.metadata.building_name}</span>
                </div>
              )}
              <Badge variant="outline" className="capitalize">
                {lead.agent_key}
              </Badge>
              {lead.contact_type_source === 'manual' && (
                <Badge variant="secondary" className="text-xs">
                  👤 Manual
                </Badge>
              )}
              {lead.contact_type_source === 'ai' && (
                <Badge variant="outline" className="text-xs">
                  🤖 IA
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* CONTENT - Grid Layout */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-[var(--exa-text-secondary)]">
                Carregando detalhes...
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* GRID: Métricas + Informações do Contato */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Métricas Rápidas (2/3) */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
                      📊 Métricas Rápidas
                    </h3>
                    <LeadMetricsCards
                      totalSent={detailedMetrics.totalSent}
                      totalReceived={detailedMetrics.totalReceived}
                      avgResponseTimeContact={detailedMetrics.avgResponseTimeContact}
                      avgResponseTimeAgent={detailedMetrics.avgResponseTimeAgent}
                      firstContact={metrics?.firstContact}
                      lastContact={metrics?.lastContact}
                      loading={detailedMetrics.loading}
                    />
                  </div>

                  {/* Informações do Contato (1/3) */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
                      📋 Informações
                    </h3>
                    <div className="exa-content-card space-y-4">
                      {/* Agente */}
                      <div>
                        <label className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide">
                          Agente Responsável
                        </label>
                        <div className="flex items-center gap-2 mt-1.5">
                          <User className="w-4 h-4 text-[var(--exa-accent)]" />
                          <span className="text-sm font-medium text-[var(--exa-text-primary)] capitalize">
                            {lead.agent_key}
                          </span>
                        </div>
                      </div>

                      {/* Primeiro Contato */}
                      {metrics?.firstContact && (
                        <div>
                          <label className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide">
                            Primeiro Contato
                          </label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Calendar className="w-4 h-4 text-[var(--exa-accent)]" />
                            <span className="text-sm text-[var(--exa-text-primary)]">
                              {format(new Date(metrics.firstContact), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Último Contato */}
                      {metrics?.lastContact && (
                        <div>
                          <label className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide">
                            Último Contato
                          </label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="w-4 h-4 text-[var(--exa-accent)]" />
                            <span className="text-sm text-[var(--exa-text-primary)]">
                              {formatDistanceToNow(new Date(metrics.lastContact), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Toggles Síndico e Hot Lead */}
                      <div>
                        <label className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide mb-2 block">
                          Classificação
                        </label>
                        <div className="flex gap-2">
                          <Button 
                            variant={lead.is_sindico ? 'default' : 'outline'}
                            size="sm"
                            onClick={toggleSindico}
                            className={cn(
                              "h-8 text-xs transition-all",
                              lead.is_sindico && "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            )}
                          >
                            <Building2 className="w-3.5 h-3.5 mr-1.5" />
                            Síndico
                          </Button>
                          <Button 
                            variant={lead.is_hot_lead ? 'default' : 'outline'}
                            size="sm"
                            onClick={toggleHotLead}
                            className={cn(
                              "h-8 text-xs transition-all",
                              lead.is_hot_lead && "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                            )}
                          >
                            <Flame className="w-3.5 h-3.5 mr-1.5" />
                            Hot Lead
                          </Button>
                        </div>
                      </div>

                      {/* Tags de Conversa */}
                      <div>
                        <label className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide mb-2 block">
                          Tags
                        </label>
                        <ConversationTags
                          phoneNumber={lead.contact_phone}
                          agentKey={lead.agent_key}
                        />
                      </div>

                      {/* Lead Score - Slider Editável */}
                      {lead.lead_score !== undefined && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide">
                              Lead Score
                            </label>
                            <span className="text-sm font-bold text-[var(--exa-text-primary)]">
                              {lead.lead_score}/100
                            </span>
                          </div>
                          <Slider
                            value={[lead.lead_score]}
                            onValueChange={([value]) => {
                              // Update local state for immediate feedback
                            }}
                            onValueCommit={([value]) => updateLeadScore(value)}
                            max={100}
                            step={5}
                            className="cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-[var(--exa-text-secondary)] mt-1">
                            <span>Baixo</span>
                            <span>Médio</span>
                            <span>Alto</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seletor de Período */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide mb-4">
                    📅 Período de Análise
                  </h3>
                  <DateRangePicker
                    period={period}
                    onPeriodChange={setPeriod}
                    customStart={customStart}
                    customEnd={customEnd}
                    onCustomDatesChange={(start, end) => {
                      setCustomStart(start);
                      setCustomEnd(end);
                    }}
                  />
                </div>

                {/* Gráfico */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide mb-4">
                    📈 Análise Temporal
                  </h3>
                  <LeadMetricsChart
                    messagesByDay={detailedMetrics.messagesByDay}
                    agentMetrics={detailedMetrics.agentMetrics}
                    selectedAgent={selectedAgent}
                    onAgentChange={setSelectedAgent}
                  />
                </div>

                {/* Tabs com demais informações */}
                <Tabs defaultValue="analysis" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 bg-[var(--exa-bg-card)]">
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-[var(--exa-accent)] data-[state=active]:text-white">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Análise IA
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-[var(--exa-accent)] data-[state=active]:text-white">
                      <FileText className="w-4 h-4 mr-2" />
                      Notas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="mt-6 space-y-4">
                    {/* Análise do Lead com IA */}
                    <div className="exa-content-card">
                      <LeadAnalysisSection 
                        profile={profile}
                        detectedType={reportData?.detectedType}
                      />
                    </div>

                    {/* Relatórios da IA */}
                    <div className="exa-content-card">
                      <h3 className="text-lg font-semibold mb-4 text-[var(--exa-text-primary)]">
                        Relatórios da IA
                      </h3>

                      <Button 
                        onClick={handleGenerateReport} 
                        disabled={generatingReport}
                        className="w-full mb-4"
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

                  <TabsContent value="notes" className="mt-6">
                    <div className="exa-content-card">
                      <ConversationNotes
                        phoneNumber={lead.contact_phone}
                        agentKey={lead.agent_key}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
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