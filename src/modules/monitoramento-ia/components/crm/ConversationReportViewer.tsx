import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  FileText, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  ChevronDown,
  Calendar,
  Target,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationReport } from '../../types/crmTypes';
import { Download } from 'lucide-react';

interface ConversationReportViewerProps {
  conversationId: string | null;
  open: boolean;
  onClose: () => void;
  reportData?: any;
}

export const ConversationReportViewer: React.FC<ConversationReportViewerProps> = ({
  conversationId,
  open,
  onClose,
  reportData: initialReportData
}) => {
  const [reports, setReports] = useState<ConversationReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ConversationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<any>(null);

  useEffect(() => {
    if (open && conversationId) {
      fetchReports();
      fetchConversationData();
    }
  }, [open, conversationId]);

  const fetchConversationData = async () => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_buildings (
            building:buildings (
              id,
              nome,
              endereco,
              bairro
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  useEffect(() => {
    if (initialReportData) {
      // Usar o relatório recém-gerado
      setSelectedReport({
        id: initialReportData.reportId,
        conversation_id: conversationId!,
        agent_key: '',
        report_data: initialReportData.report,
        summary: initialReportData.report.summary,
        contact_profile: initialReportData.report.contactProfile,
        interests: initialReportData.report.interests,
        conversation_stage: initialReportData.report.conversationStage,
        recommendations: initialReportData.report.recommendations,
        generated_at: new Date().toISOString(),
        generated_by: null,
        created_at: new Date().toISOString()
      });
    }
  }, [initialReportData]);

  const fetchReports = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversation_reports')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
      if (data && data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      novo: 'bg-blue-500',
      qualificando: 'bg-yellow-500',
      interessado: 'bg-green-500',
      negociando: 'bg-orange-500',
      proposta_enviada: 'bg-purple-500',
      fechando: 'bg-emerald-500',
      perdido: 'bg-red-500',
      cliente_ativo: 'bg-cyan-500'
    };
    return colors[stage] || 'bg-gray-500';
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      novo: 'Novo Contato',
      qualificando: 'Qualificando',
      interessado: 'Interessado',
      negociando: 'Negociando',
      proposta_enviada: 'Proposta Enviada',
      fechando: 'Fechando',
      perdido: 'Perdido',
      cliente_ativo: 'Cliente Ativo'
    };
    return labels[stage] || stage;
  };

  const handleDownloadPDF = async () => {
    if (!selectedReport || !conversation) return;

    const buildings = conversation.conversation_buildings?.map((cb: any) => ({
      nome: cb.building?.nome || ''
    })) || [];

    const conversationData = {
      metrics: {
        totalConversations: 1,
        totalMessages: conversation.message_count || 0,
        averageMessagesPerConv: conversation.message_count || 0,
        awaitingResponse: 0,
        criticalConversations: 0,
        hotLeads: 0,
      }
    };

    await generateConversationReportPDF(
      conversationData,
      selectedReport.report_data,
      selectedReport.generated_at
    );
  };

  if (!selectedReport) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Relatórios da Conversa</DialogTitle>
            <DialogDescription>
              Nenhum relatório gerado ainda
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Clique em "Gerar Relatório da IA" para criar um relatório desta conversa
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const report = selectedReport.report_data;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatório da Conversa
          </DialogTitle>
          <DialogDescription>
            Análise gerada em {new Date(selectedReport.generated_at).toLocaleString('pt-BR')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Resumo Executivo */}
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Resumo Executivo</h3>
              </div>
              <p className="text-sm leading-relaxed">{report.summary}</p>
            </div>

            {/* Score e Stage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Oportunidade</span>
                </div>
                <div className="text-3xl font-bold">{report.opportunityScore}%</div>
              </div>
              
              <div className="glass-card p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Etapa</span>
                </div>
                <Badge className={getStageColor(report.conversationStage)}>
                  {getStageLabel(report.conversationStage)}
                </Badge>
              </div>
            </div>

            {/* Perfil do Contato */}
            {report.contactProfile && (
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full glass-card p-4 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Perfil do Contato</h3>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 glass-card p-4 rounded-lg space-y-2">
                  {report.contactProfile.detectedName && (
                    <div>
                      <span className="text-xs text-muted-foreground">Nome Detectado:</span>
                      <p className="font-medium">{report.contactProfile.detectedName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{report.contactProfile.detectedType}</p>
                  </div>
                  {report.contactProfile.personality && (
                    <div>
                      <span className="text-xs text-muted-foreground">Personalidade:</span>
                      <p className="font-medium">{report.contactProfile.personality}</p>
                    </div>
                  )}
                  {report.contactProfile.communicationStyle && (
                    <div>
                      <span className="text-xs text-muted-foreground">Estilo de Comunicação:</span>
                      <p className="font-medium">{report.contactProfile.communicationStyle}</p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Interesses */}
            {report.interests && report.interests.length > 0 && (
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full glass-card p-4 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Interesses</h3>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 glass-card p-4 rounded-lg space-y-3">
                  {report.interests.map((interest: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-primary pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {interest.type}
                        </Badge>
                        <Badge 
                          variant={interest.priority === 'alta' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {interest.priority}
                        </Badge>
                      </div>
                      <p className="text-sm">{interest.description}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Pontos-Chave */}
            {report.keyPoints && report.keyPoints.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full glass-card p-4 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Pontos-Chave</h3>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 glass-card p-4 rounded-lg">
                  <ul className="space-y-2">
                    {report.keyPoints.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Objeções/Preocupações */}
            {report.concerns && report.concerns.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full glass-card p-4 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <h3 className="font-semibold">Objeções e Preocupações</h3>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 glass-card p-4 rounded-lg">
                  <ul className="space-y-2">
                    {report.concerns.map((concern: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Recomendações */}
            {report.recommendations && report.recommendations.length > 0 && (
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full glass-card p-4 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold">Recomendações</h3>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 glass-card p-4 rounded-lg space-y-3">
                  {report.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-yellow-500 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={rec.priority === 'alta' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm mb-1">{rec.action}</p>
                      <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Timeline */}
            {report.timeline && report.timeline.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full glass-card p-4 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Linha do Tempo</h3>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 glass-card p-4 rounded-lg">
                  <div className="space-y-3">
                    {report.timeline.map((event: any, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {idx < report.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {event.event}
                            </Badge>
                          </div>
                          <p className="text-sm">{event.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        <Separator />
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {reports.length > 1 && `${reports.length} relatórios disponíveis`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
