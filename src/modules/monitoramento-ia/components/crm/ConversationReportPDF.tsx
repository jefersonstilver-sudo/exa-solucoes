import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationData {
  phone_number: string;
  contact_name?: string;
  contact_type?: string;
  buildings?: Array<{ nome: string }>;
  first_message_at?: string;
  last_message_at?: string;
  message_count?: number;
  avg_response_time?: string;
}

interface ReportData {
  summary?: string;
  contact_profile?: {
    interests?: string[];
    pain_points?: string[];
    stage?: string;
  };
  recommendations?: string[];
  sentiment_analysis?: {
    overall?: string;
    tone?: string;
  };
  ocorrencias?: Array<{
    data: string;
    tipo: string;
    descricao: string;
  }>;
  insatisfacoes?: Array<{
    motivo: string;
    gravidade: string;
    resolvido: boolean;
  }>;
}

export const generateConversationReportPDF = async (
  conversation: ConversationData,
  report: ReportData,
  generatedAt: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, yPos);
    yPos += lines.length * (fontSize * 0.5);
  };

  // Helper to add section
  const addSection = (title: string, content: string) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    yPos += 5;
    addText(title, 12, true);
    yPos += 2;
    addText(content, 10);
    yPos += 5;
  };

  // Header with logo placeholder
  doc.setFillColor(37, 99, 235); // Blue color
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EXA MÍDIA', margin, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), pageWidth - margin - 40, 15);
  
  yPos = 40;
  doc.setTextColor(0, 0, 0);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = 'RELATÓRIO DE ANÁLISE DE LEAD';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, yPos);
  yPos += 15;

  // Line separator
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Contact Data Section
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 50, 'F');
  yPos += 8;
  
  addText('DADOS DO CONTATO', 12, true);
  yPos += 2;
  addText(`Nome: ${conversation.contact_name || 'Não informado'}`, 10);
  addText(`Telefone: ${conversation.phone_number}`, 10);
  addText(`Tipo: ${conversation.contact_type || 'Não definido'}`, 10);
  
  if (conversation.buildings && conversation.buildings.length > 0) {
    const buildingNames = conversation.buildings.map(b => b.nome).join(', ');
    addText(`Prédio(s): ${buildingNames}`, 10);
  }
  
  if (conversation.first_message_at) {
    addText(`Primeiro Contato: ${format(new Date(conversation.first_message_at), 'dd/MM/yyyy', { locale: ptBR })}`, 10);
  }
  if (conversation.last_message_at) {
    addText(`Último Contato: ${format(new Date(conversation.last_message_at), 'dd/MM/yyyy', { locale: ptBR })}`, 10);
  }
  
  yPos += 8;

  // Executive Summary
  if (report.summary) {
    addSection('RESUMO EXECUTIVO', report.summary);
  }

  // Opportunity Analysis
  if (report.contact_profile) {
    const profile = report.contact_profile;
    let analysisText = '';
    
    if (profile.stage) {
      analysisText += `Estágio: ${profile.stage}\n`;
    }
    
    if (profile.interests && profile.interests.length > 0) {
      analysisText += `\nInteresses:\n${profile.interests.map(i => `• ${i}`).join('\n')}`;
    }
    
    if (profile.pain_points && profile.pain_points.length > 0) {
      analysisText += `\n\nPontos de Atenção:\n${profile.pain_points.map(p => `• ${p}`).join('\n')}`;
    }
    
    if (analysisText) {
      addSection('ANÁLISE DE OPORTUNIDADE', analysisText);
    }
  }

  // Occurrences
  if (report.ocorrencias && report.ocorrencias.length > 0) {
    let occurrencesText = report.ocorrencias.map(o => 
      `• ${format(new Date(o.data), 'dd/MM', { locale: ptBR })} - ${o.tipo}: ${o.descricao}`
    ).join('\n');
    addSection('HISTÓRICO DE OCORRÊNCIAS', occurrencesText);
  }

  // Dissatisfactions
  if (report.insatisfacoes && report.insatisfacoes.length > 0) {
    let dissatisfactionsText = report.insatisfacoes.map(i => 
      `• ${i.motivo} (${i.gravidade}) ${i.resolvido ? '✓ Resolvido' : '⚠ Pendente'}`
    ).join('\n');
    addSection('INSATISFAÇÕES IDENTIFICADAS', dissatisfactionsText);
  }

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    const recText = report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
    addSection('PRÓXIMOS PASSOS RECOMENDADOS', recText);
  }

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório gerado por EXA Mídia IA', margin, yPos);
  doc.text('www.examidia.com.br', pageWidth - margin - 40, yPos);

  // Save PDF
  const fileName = `relatorio_${conversation.phone_number.replace(/\D/g, '')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  doc.save(fileName);
};
