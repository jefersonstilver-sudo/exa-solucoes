import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateReportPDF } from '../utils/generateReportPDF';

const COLORS = ['#D72638', '#9C1E1E', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

export const AIReportViewerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportData = location.state?.reportData;

  if (!reportData?.data?.aiInsights) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhum relatório disponível</p>
          <Button onClick={() => navigate('/admin/monitoramento-ia/relatorios-ia')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const { aiInsights, metrics, period } = reportData.data;

  const handleDownloadPDF = () => {
    generateReportPDF(reportData.data);
  };

  // Preparar dados dos gráficos
  const messagesByTypeData = aiInsights.messagesByType?.map((item: any) => ({
    name: item.type,
    value: item.received + item.sent,
    contacts: item.contacts,
  })) || [];

  const hourlyData = Object.entries(aiInsights.hourlyDistribution || {}).map(([hour, count]) => ({
    hour: `${hour}h`,
    messages: count,
  }));

  const periodData = [
    { name: 'Manhã', enviadas: aiInsights.periodDistribution?.morning?.sent || 0, recebidas: aiInsights.periodDistribution?.morning?.received || 0 },
    { name: 'Tarde', enviadas: aiInsights.periodDistribution?.afternoon?.sent || 0, recebidas: aiInsights.periodDistribution?.afternoon?.received || 0 },
    { name: 'Noite', enviadas: aiInsights.periodDistribution?.evening?.sent || 0, recebidas: aiInsights.periodDistribution?.evening?.received || 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Action Bar */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/monitoramento-ia/relatorios-ia')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <Button
            onClick={handleDownloadPDF}
            className="gap-2 bg-[#D72638] hover:bg-[#9C1E1E]"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9C1E1E] via-[#D72638] to-[#9C1E1E] text-white rounded-2xl p-8 shadow-xl">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">EXA MÍDIA</h1>
              <div className="border-t border-b border-white/30 py-4">
                <h2 className="text-2xl font-semibold">RELATÓRIO DIÁRIO DE ATIVIDADES</h2>
                <p className="text-lg mt-2">
                  {format(new Date(period.start), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <p className="text-lg">
                <span className="font-semibold">AGENTE:</span> {reportData.data.agentKey || 'Eduardo'}
              </p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-4">
              RESUMO EXECUTIVO
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {aiInsights.executiveSummary || 'Sem resumo executivo disponível.'}
            </p>
          </div>

          {/* Journey */}
          {aiInsights.journey && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-4">
                JORNADA DO DIA
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Primeira mensagem</p>
                  <p className="text-lg font-semibold">{aiInsights.journey.firstMessage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última mensagem</p>
                  <p className="text-lg font-semibold">{aiInsights.journey.lastMessage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo ativo</p>
                  <p className="text-lg font-semibold">{aiInsights.journey.activeTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intervalos</p>
                  <p className="text-lg font-semibold">{aiInsights.journey.breaks}</p>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          {aiInsights.keyMetrics && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-4">
                NÚMEROS GERAIS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total de Contatos</p>
                  <p className="text-3xl font-bold text-[#D72638]">{aiInsights.keyMetrics.totalContacts}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Novas Conversas</p>
                  <p className="text-3xl font-bold text-green-600">{aiInsights.keyMetrics.newConversations}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Enviadas</p>
                  <p className="text-3xl font-bold text-blue-600">{aiInsights.keyMetrics.totalSent}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Recebidas</p>
                  <p className="text-3xl font-bold text-purple-600">{aiInsights.keyMetrics.totalReceived}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Proporção</p>
                  <p className="text-2xl font-bold">{aiInsights.keyMetrics.proportion}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Tempo Médio Resposta</p>
                  <p className="text-2xl font-bold">{aiInsights.keyMetrics.avgResponseTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages by Type Chart */}
          {messagesByTypeData.length > 0 && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-6">
                MENSAGENS POR TIPO DE CONTATO
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 font-semibold">Tipo</th>
                        <th className="text-center p-3 font-semibold">Contatos</th>
                        <th className="text-center p-3 font-semibold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiInsights.messagesByType?.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/50">
                          <td className="p-3 font-medium">
                            {item.icon} {item.type}
                          </td>
                          <td className="p-3 text-center">{item.contacts}</td>
                          <td className="p-3 text-center font-semibold text-[#D72638]">
                            {item.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pie Chart */}
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={messagesByTypeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: ${entry.contacts}`}
                      >
                        {messagesByTypeData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Hourly Distribution Chart */}
          {hourlyData.length > 0 && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-6">
                DISTRIBUIÇÃO HORÁRIA
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#D72638" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Period Distribution Chart */}
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-6">
              DISTRIBUIÇÃO POR PERÍODO
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="enviadas" fill="#4ECDC4" name="Enviadas" radius={[8, 8, 0, 0]} />
                <Bar dataKey="recebidas" fill="#D72638" name="Recebidas" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hot Leads */}
          {aiInsights.hotLeads && aiInsights.hotLeads.length > 0 && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-6">
                🔥 HOT LEADS DO DIA
              </h3>
              <div className="space-y-4">
                {aiInsights.hotLeads.map((lead: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-muted/50 to-background border-2 border-border rounded-xl p-6 hover:border-[#D72638] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-foreground">{lead.name}</h4>
                        <p className="text-sm text-muted-foreground">{lead.type}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full font-bold ${
                        lead.score >= 90 ? 'text-green-600 bg-green-100' :
                        lead.score >= 75 ? 'text-yellow-600 bg-yellow-100' :
                        'text-orange-600 bg-orange-100'
                      }`}>
                        Score: {lead.score}/100
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">📞 Telefone:</span> {lead.phone}</p>
                      <p><span className="font-semibold">💬 Mensagens:</span> {lead.messages}</p>
                      <p><span className="font-semibold">🎯 Interesse:</span> {lead.highlight}</p>
                      <p className="text-[#D72638] font-semibold">→ Próximo passo: {lead.nextStep}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavioral Analysis */}
          {aiInsights.behavioralAnalysis && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-6">
                ANÁLISE COMPORTAMENTAL
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Normal Patterns */}
                <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
                  <h4 className="font-semibold text-lg text-green-900 dark:text-green-100 mb-3">✓ Padrões Normais</h4>
                  <ul className="space-y-2">
                    {aiInsights.behavioralAnalysis.normalPatterns?.map((pattern: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Deviations */}
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <h4 className="font-semibold text-lg text-yellow-900 dark:text-yellow-100 mb-3">⚠️ Desvios Detectados</h4>
                  <ul className="space-y-2">
                    {aiInsights.behavioralAnalysis.deviations?.map((dev: any, index: number) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">{dev.time}:</span> {dev.description}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Approach Errors */}
                <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
                  <h4 className="font-semibold text-lg text-red-900 dark:text-red-100 mb-3">❌ Erros de Abordagem</h4>
                  <ul className="space-y-2">
                    {aiInsights.behavioralAnalysis.approachErrors?.map((error: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Opportunities */}
          {aiInsights.opportunities && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-6">
                OPORTUNIDADES E FALHAS
              </h3>
              <div className="space-y-6">
                {/* Seized */}
                {aiInsights.opportunities.seized?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg text-green-600 mb-2">✓ Oportunidades Aproveitadas</h4>
                    <ul className="space-y-1">
                      {aiInsights.opportunities.seized.map((opp: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">• {opp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* In Progress */}
                {aiInsights.opportunities.inProgress?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg text-yellow-600 mb-2">⏳ Em Andamento</h4>
                    {aiInsights.opportunities.inProgress.map((opp: any, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground mb-2">
                        <p>• {opp.description}</p>
                        <p className="pl-4 text-[#D72638]">→ {opp.nextAction}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lost */}
                {aiInsights.opportunities.lost?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg text-red-600 mb-2">❌ Oportunidades Perdidas</h4>
                    {aiInsights.opportunities.lost.map((opp: any, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground mb-2">
                        <p>• {opp.description}</p>
                        <p className="pl-4 text-gray-600">Razão: {opp.reason}</p>
                        <p className="pl-4 text-[#D72638]">→ Ação: {opp.action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score of Day */}
          {aiInsights.scoreOfDay && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-6">
                SCORE DO DIA
              </h3>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-40 h-40 rounded-full border-8 border-[#D72638] bg-background shadow-xl">
                  <div>
                    <div className="text-5xl font-bold text-[#D72638]">{aiInsights.scoreOfDay.overall}</div>
                    <div className="text-xl font-medium text-muted-foreground">/100</div>
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold text-foreground">
                  {aiInsights.scoreOfDay.classification}
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(aiInsights.scoreOfDay.components || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-sm font-bold text-[#D72638]">{value.score}/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-[#D72638] transition-all"
                        style={{ width: `${value.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-2xl font-bold text-foreground border-b-2 border-[#D72638] pb-2 mb-6">
                💡 RECOMENDAÇÕES PARA AMANHÃ
              </h3>
              <div className="space-y-3">
                {aiInsights.recommendations.map((rec: any, index: number) => (
                  <div
                    key={index}
                    className={`rounded-xl border-2 p-4 ${
                      rec.priority === 'urgent' ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800' :
                      rec.priority === 'important' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800' :
                      'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rec.emoji}</span>
                      <div className="flex-1">
                        <span className="font-bold text-sm uppercase">{rec.priority}:</span>
                        <span className="ml-2">{rec.action}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border text-center">
            <p className="text-sm text-muted-foreground">
              Relatório gerado automaticamente por <span className="font-semibold text-[#D72638]">EXA Mídia IA</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Data de geração: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Este relatório é confidencial e destinado exclusivamente aos diretores da EXA Mídia.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
