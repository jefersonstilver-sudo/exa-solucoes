import jsPDF from 'jspdf';

export const generateReportPDF = (report: any): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Função auxiliar para adicionar nova página se necessário
  const checkPageBreak = (heightNeeded: number) => {
    if (yPosition + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Função para adicionar texto com quebra de linha
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    checkPageBreak(lines.length * lineHeight);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * lineHeight;
  };

  // Header com gradiente simulado
  doc.setFillColor(156, 30, 30);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EXA MÍDIA', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('RELATÓRIO DIÁRIO DE ATIVIDADES', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(12);
  const reportDate = new Date(report.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.text(reportDate, pageWidth / 2, 36, { align: 'center' });

  // Reset cor do texto
  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  // RESUMO EXECUTIVO
  addText('═══════════════════════════════════════', 14, true);
  addText('RESUMO EXECUTIVO', 14, true);
  addText('═══════════════════════════════════════', 14, true);
  yPosition += 5;

  const insights = report.ai_insights || {};
  if (insights.executiveSummary) {
    addText(insights.executiveSummary, 10, false);
  }
  yPosition += 10;

  // JORNADA DO DIA
  if (insights.journey) {
    addText('🕐 JORNADA DO DIA', 12, true);
    yPosition += 3;
    addText(`Primeira mensagem: ${insights.journey.firstMessage || 'N/A'}       Última mensagem: ${insights.journey.lastMessage || 'N/A'}`, 10);
    addText(`Tempo ativo: ${insights.journey.activeTime || 'N/A'}       Intervalos: ${insights.journey.breaks || 'N/A'}`, 10);
    yPosition += 10;
  }

  // NÚMEROS GERAIS
  const metrics = insights.keyMetrics || {};
  addText('📊 NÚMEROS GERAIS', 12, true);
  yPosition += 3;
  addText(`Total de Contatos: ${metrics.totalContacts || report.total_conversations || 0}       Novas Conversas: ${metrics.newConversations || 0}`, 10);
  addText(`Total Enviadas: ${metrics.totalSent || 0}       Total Recebidas: ${metrics.totalReceived || 0}`, 10);
  addText(`Proporção: ${metrics.proportion || 'N/A'}       Tempo Médio Resposta: ${metrics.avgResponseTime || 'N/A'}`, 10);
  yPosition += 10;

  checkPageBreak(80);

  // MENSAGENS POR TIPO DE CONTATO
  addText('═══════════════════════════════════════', 14, true);
  addText('MENSAGENS POR TIPO DE CONTATO', 14, true);
  addText('═══════════════════════════════════════', 14, true);
  yPosition += 5;

  if (insights.messagesByType && insights.messagesByType.length > 0) {
    insights.messagesByType.forEach((item: any, index: number) => {
      addText(`${index + 1}. ${item.icon || ''} ${item.type}`, 10, true);
      addText(`   Contatos: ${item.contacts}   Enviadas: ${item.sent}   Recebidas: ${item.received}   % Total: ${item.percentage.toFixed(1)}%`, 10);
      yPosition += 2;
    });
  }
  yPosition += 10;

  checkPageBreak(60);

  // DISTRIBUIÇÃO POR PERÍODO
  addText('═══════════════════════════════════════', 14, true);
  addText('DISTRIBUIÇÃO POR PERÍODO DO DIA', 14, true);
  addText('═══════════════════════════════════════', 14, true);
  yPosition += 5;

  const periods = insights.periodDistribution || {};
  
  if (periods.morning) {
    addText('🌅 MANHÃ (06:00 - 12:00)', 11, true);
    addText(`Mensagens Enviadas: ${periods.morning.sent}       Contatos Atendidos: ${periods.morning.contacts}`, 10);
    addText(`Tempo Médio Resposta: ${periods.morning.avgResponse || 'N/A'}       Conversas Iniciadas: ${periods.morning.newConversations || 0}`, 10);
    if (periods.morning.topTypes) {
      addText(`Tipos mais atendidos: ${periods.morning.topTypes.join(', ')}`, 10);
    }
    yPosition += 5;
  }

  if (periods.afternoon) {
    addText('☀️ TARDE (12:00 - 18:00)', 11, true);
    addText(`Mensagens Enviadas: ${periods.afternoon.sent}       Contatos Atendidos: ${periods.afternoon.contacts}`, 10);
    addText(`Tempo Médio Resposta: ${periods.afternoon.avgResponse || 'N/A'}       Conversas Iniciadas: ${periods.afternoon.newConversations || 0}`, 10);
    if (periods.afternoon.topTypes) {
      addText(`Tipos mais atendidos: ${periods.afternoon.topTypes.join(', ')}`, 10);
    }
    yPosition += 5;
  }

  if (periods.evening) {
    addText('🌙 NOITE (18:00 - 00:00)', 11, true);
    addText(`Mensagens Enviadas: ${periods.evening.sent}       Contatos Atendidos: ${periods.evening.contacts}`, 10);
    addText(`Tempo Médio Resposta: ${periods.evening.avgResponse || 'N/A'}       Conversas Iniciadas: ${periods.evening.newConversations || 0}`, 10);
    if (periods.evening.topTypes) {
      addText(`Tipos mais atendidos: ${periods.evening.topTypes.join(', ')}`, 10);
    }
    yPosition += 5;
  }

  checkPageBreak(80);

  // HOT LEADS DO DIA
  addText('═══════════════════════════════════════', 14, true);
  addText('🔥 HOT LEADS DO DIA', 14, true);
  addText('═══════════════════════════════════════', 14, true);
  yPosition += 5;

  if (insights.hotLeads && insights.hotLeads.length > 0) {
    insights.hotLeads.forEach((lead: any, index: number) => {
      checkPageBreak(30);
      addText(`${index + 1}. ${lead.name} - ${lead.type}       Score: ${lead.score}/100`, 11, true);
      addText(`   📱 ${lead.phone}`, 10);
      addText(`   💬 ${lead.messages} mensagens trocadas`, 10);
      addText(`   🎯 ${lead.highlight}`, 10);
      addText(`   💡 Próximo passo: ${lead.nextStep}`, 10);
      yPosition += 5;
    });
  } else {
    addText('Nenhum hot lead identificado no período', 10);
  }
  yPosition += 10;

  checkPageBreak(60);

  // ANÁLISE COMPORTAMENTAL
  addText('═══════════════════════════════════════', 14, true);
  addText('📊 ANÁLISE COMPORTAMENTAL', 14, true);
  addText('═══════════════════════════════════════', 14, true);
  yPosition += 5;

  const behavioral = insights.behavioralAnalysis || {};
  
  addText('✅ PADRÕES NORMAIS', 11, true);
  if (behavioral.normalPatterns && behavioral.normalPatterns.length > 0) {
    behavioral.normalPatterns.forEach((pattern: string) => {
      addText(`• ${pattern}`, 10);
    });
  } else {
    addText('Nenhum padrão identificado', 10);
  }
  yPosition += 5;

  addText('⚠️ DESVIOS DETECTADOS', 11, true);
  if (behavioral.deviations && behavioral.deviations.length > 0) {
    behavioral.deviations.forEach((deviation: any) => {
      addText(`• ${deviation.time || ''} - ${deviation.description} (${deviation.severity})`, 10);
    });
  } else {
    addText('Nenhum desvio detectado', 10);
  }
  yPosition += 5;

  addText('❌ ERROS DE ABORDAGEM', 11, true);
  if (behavioral.approachErrors && behavioral.approachErrors.length > 0) {
    behavioral.approachErrors.forEach((error: string) => {
      addText(`• ${error}`, 10);
    });
  } else {
    addText('✓ Nenhum erro detectado', 10);
  }
  yPosition += 10;

  checkPageBreak(80);

  // OPORTUNIDADES E FALHAS
  addText('═══════════════════════════════════════', 14, true);
  addText('🎯 OPORTUNIDADES E FALHAS', 14, true);
  addText('═══════════════════════════════════════', 14, true);
  yPosition += 5;

  const opportunities = insights.opportunities || {};
  
  addText('✅ OPORTUNIDADES APROVEITADAS', 11, true);
  if (opportunities.seized && opportunities.seized.length > 0) {
    opportunities.seized.forEach((opp: string) => {
      addText(`• ${opp}`, 10);
    });
  } else {
    addText('Nenhuma oportunidade aproveitada', 10);
  }
  yPosition += 5;

  addText('⚠️ OPORTUNIDADES EM ANDAMENTO', 11, true);
  if (opportunities.inProgress && opportunities.inProgress.length > 0) {
    opportunities.inProgress.forEach((opp: any) => {
      addText(`• ${opp.description}`, 10);
      addText(`  → ${opp.nextAction}`, 10);
    });
  } else {
    addText('Nenhuma oportunidade em andamento', 10);
  }
  yPosition += 5;

  addText('❌ OPORTUNIDADES PERDIDAS/FALHAS', 11, true);
  if (opportunities.lost && opportunities.lost.length > 0) {
    opportunities.lost.forEach((opp: any) => {
      addText(`• ${opp.description}`, 10);
      addText(`  Razão: ${opp.reason}`, 10);
      addText(`  → Ação: ${opp.action}`, 10);
    });
  } else {
    addText('✓ Nenhuma oportunidade perdida', 10);
  }
  yPosition += 10;

  checkPageBreak(60);

  // SCORE DO DIA
  addText('═══════════════════════════════════════', 14, true);
  addText('💯 SCORE DO DIA', 14, true);
  addText('═══════════════════════════════════════', 14, true);
  yPosition += 5;

  const score = insights.scoreOfDay || {};
  if (score.overall) {
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(`${score.overall}/100`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    doc.setFontSize(14);
    doc.text(score.classification || '', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (score.components) {
      addText('COMPONENTES DO SCORE:', 11, true);
      Object.entries(score.components).forEach(([key, value]: [string, any]) => {
        const labels: Record<string, string> = {
          volume: 'Volume de Atendimento',
          responseTime: 'Tempo de Resposta',
          quality: 'Qualidade do Atendimento',
          conversions: 'Conversões/Oportunidades',
          satisfaction: 'Gestão de Insatisfações'
        };
        addText(`${labels[key]}: ${value.score}/100 (peso ${value.weight}%)`, 10);
      });
    }
  }
  yPosition += 10;

  checkPageBreak(60);

  // RECOMENDAÇÕES PARA AMANHÃ
  addText('═══════════════════════════════════════', 14, true);
  addText('💡 RECOMENDAÇÕES PARA AMANHÃ', 14, true);
  addText('═══════════════════════════════════════', 14, true);
  yPosition += 5;

  if (insights.recommendations && insights.recommendations.length > 0) {
    insights.recommendations.forEach((rec: any, index: number) => {
      const priorityLabel = rec.priority === 'urgent' ? 'URGENTE' : rec.priority === 'important' ? 'IMPORTANTE' : 'NORMAL';
      addText(`${index + 1}. ${rec.emoji || ''} ${priorityLabel}: ${rec.action}`, 10, rec.priority === 'urgent');
      yPosition += 2;
    });
  } else {
    addText('Nenhuma recomendação específica para amanhã', 10);
  }
  yPosition += 15;

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Relatório gerado automaticamente por EXA Mídia IA', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text('Este relatório é confidencial e destinado exclusivamente aos diretores da EXA Mídia.', pageWidth / 2, pageHeight - 5, { align: 'center' });

  return doc.output('blob');
};
