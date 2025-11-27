import jsPDF from 'jspdf';

interface ConversationData {
  metrics?: {
    totalConversations?: number;
    totalMessages?: number;
    averageMessagesPerConv?: number;
    awaitingResponse?: number;
    criticalConversations?: number;
    hotLeads?: number;
  };
  topConversations?: Array<{
    contactName: string;
    phone: string;
    messageCount: number;
    sentiment: string;
    leadScore: number;
  }>;
}

interface ReportData {
  executiveSummary?: string;
  insights?: Array<{
    title: string;
    description: string;
    impact?: string;
    importance?: string;
  }>;
  opportunities?: Array<{
    title: string;
    description: string;
    potentialValue?: string;
  }>;
  recommendations?: string[];
  periodAnalysis?: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
}

export const generateConversationReportPDF = (
  conversation: ConversationData,
  report: ReportData,
  generatedAt: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 0;

  // Função auxiliar para adicionar texto
  const addText = (text: string, x: number, y: number, size: number, color: number[] = [0, 0, 0], style: string = 'normal') => {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', style);
    doc.text(text, x, y);
  };

  // Função auxiliar para adicionar seção
  const addSection = (title: string, y: number): number => {
    // Linha decorativa antes do título
    doc.setDrawColor(156, 30, 30);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 15, y);
    
    addText(title, margin, y + 6, 14, [156, 30, 30], 'bold');
    return y + 12;
  };

  // ===== PÁGINA 1: HEADER E RESUMO =====
  
  // Header com gradiente vermelho EXA
  doc.setFillColor(156, 30, 30);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Linha decorativa em gradiente (simulado com retângulos)
  for (let i = 0; i < 10; i++) {
    const alpha = i / 10;
    const r = Math.round(156 + (215 - 156) * alpha);
    const g = Math.round(30 + (38 - 30) * alpha);
    const b = Math.round(30 + (56 - 30) * alpha);
    doc.setFillColor(r, g, b);
    doc.rect(0, 50 + i * 0.5, pageWidth, 0.5, 'F');
  }
  
  // Logo EXA (texto estilizado como logo)
  addText('EXA', margin, 22, 32, [255, 255, 255], 'bold');
  addText('SOLUÇÕES', margin, 32, 10, [255, 255, 255], 'normal');
  
  // Título do relatório
  addText('Relatório de Conversas', margin, 44, 18, [255, 255, 255], 'bold');
  
  // Informações do header
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Gerado em: ${generatedAt}`, pageWidth - margin, 30, { align: 'right' });
  doc.text('Powered by IA Avançada', pageWidth - margin, 38, { align: 'right' });

  yPos = 70;

  // ===== RESUMO EXECUTIVO =====
  if (report.executiveSummary) {
    yPos = addSection('Resumo Executivo', yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(report.executiveSummary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 5 + 12;
  }

  // ===== MÉTRICAS PRINCIPAIS =====
  if (conversation.metrics) {
    yPos = addSection('Métricas Principais', yPos);
    
    const metrics = conversation.metrics;
    const metricsData = [
      { label: 'Total de Conversas', value: metrics.totalConversations || 0, icon: '💬' },
      { label: 'Total de Mensagens', value: metrics.totalMessages || 0, icon: '✉️' },
      { label: 'Média por Conversa', value: (metrics.averageMessagesPerConv || 0).toFixed(1), icon: '📊' },
      { label: 'Aguardando Resposta', value: metrics.awaitingResponse || 0, icon: '⏳' },
      { label: 'Conversas Críticas', value: metrics.criticalConversations || 0, icon: '🚨' },
      { label: 'Hot Leads', value: metrics.hotLeads || 0, icon: '🔥' },
    ];

    // Grid 2x3 de cards de métricas
    const cardWidth = (pageWidth - 2 * margin - 10) / 3;
    const cardHeight = 20;
    let cardX = margin;
    let cardY = yPos;

    metricsData.forEach((metric, index) => {
      if (index % 3 === 0 && index > 0) {
        cardY += cardHeight + 5;
        cardX = margin;
      }

      // Card com borda
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

      // Ícone e label
      addText(metric.icon, cardX + 3, cardY + 8, 12, [156, 30, 30]);
      addText(metric.label, cardX + 10, cardY + 8, 8, [100, 100, 100], 'normal');
      
      // Valor
      addText(String(metric.value), cardX + 10, cardY + 16, 14, [0, 0, 0], 'bold');

      cardX += cardWidth + 5;
    });

    yPos = cardY + cardHeight + 15;
  }

  // ===== INSIGHTS PRINCIPAIS =====
  if (report.insights && report.insights.length > 0) {
    // Verificar se precisa de nova página
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 30;
    }

    yPos = addSection('Insights Principais', yPos);

    report.insights.forEach((insight, index) => {
      // Verificar espaço na página
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 30;
      }

      // Card de insight
      const cardHeight = 30;
      doc.setFillColor(252, 252, 252);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, cardHeight, 3, 3, 'FD');

      // Número do insight
      doc.setFillColor(156, 30, 30);
      doc.circle(margin + 6, yPos + 8, 5, 'F');
      addText(String(index + 1), margin + 4, yPos + 10, 10, [255, 255, 255], 'bold');

      // Título
      addText(insight.title, margin + 15, yPos + 9, 11, [0, 0, 0], 'bold');

      // Descrição
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(insight.description, pageWidth - 2 * margin - 20);
      doc.text(descLines, margin + 15, yPos + 16);

      // Badge de importância
      const importance = insight.importance || insight.impact;
      if (importance) {
        const badgeColors: Record<string, number[]> = {
          'alta': [220, 38, 38],
          'high': [220, 38, 38],
          'média': [234, 179, 8],
          'medium': [234, 179, 8],
          'baixa': [34, 197, 94],
          'low': [34, 197, 94],
        };
        const color = badgeColors[importance.toLowerCase()] || [100, 100, 100];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(pageWidth - margin - 30, yPos + 4, 25, 8, 2, 2, 'F');
        addText(importance, pageWidth - margin - 27, yPos + 9, 7, [255, 255, 255], 'bold');
      }

      yPos += cardHeight + 8;
    });
  }

  // ===== OPORTUNIDADES =====
  if (report.opportunities && report.opportunities.length > 0) {
    // Nova página se necessário
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 30;
    }

    yPos = addSection('Oportunidades Identificadas', yPos);

    report.opportunities.forEach((opp, index) => {
      if (yPos > pageHeight - 45) {
        doc.addPage();
        yPos = 30;
      }

      // Card de oportunidade
      doc.setFillColor(254, 252, 232); // Fundo amarelo claro
      doc.setDrawColor(251, 191, 36);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 3, 3, 'FD');

      // Ícone de oportunidade
      addText('💰', margin + 3, yPos + 8, 12, [251, 191, 36]);

      // Título
      addText(opp.title, margin + 12, yPos + 9, 10, [0, 0, 0], 'bold');

      // Descrição
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const oppLines = doc.splitTextToSize(opp.description, pageWidth - 2 * margin - 15);
      doc.text(oppLines, margin + 12, yPos + 15);

      // Valor potencial
      if (opp.potentialValue) {
        addText(`Valor: ${opp.potentialValue}`, margin + 12, yPos + 24, 8, [156, 30, 30], 'bold');
      }

      yPos += 33;
    });
  }

  // ===== RECOMENDAÇÕES =====
  if (report.recommendations && report.recommendations.length > 0) {
    // Nova página se necessário
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = 30;
    }

    yPos = addSection('Recomendações', yPos);

    report.recommendations.forEach((rec, index) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 30;
      }

      // Bullet point estilizado
      doc.setFillColor(156, 30, 30);
      doc.circle(margin + 2, yPos + 2, 2, 'F');

      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      const recLines = doc.splitTextToSize(rec, pageWidth - 2 * margin - 8);
      doc.text(recLines, margin + 7, yPos + 4);
      yPos += recLines.length * 4.5 + 6;
    });
  }

  // ===== FOOTER EM TODAS AS PÁGINAS =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Linha decorativa no footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Texto do footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text('EXA Soluções', margin, pageHeight - 10);
    doc.text(new Date().getFullYear().toString(), pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // Download
  const fileName = `relatorio-conversas-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
