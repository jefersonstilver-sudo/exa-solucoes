
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  created_at: string;
  status: string;
  client_name: string;
  client_email: string;
  valor_total: number;
  data_inicio?: string;
  data_fim?: string;
  plano_meses: number;
  log_pagamento?: any;
  cupom_id?: string;
  termos_aceitos?: boolean;
}

interface PanelData {
  id: string;
  code: string;
  building_name: string;
  building_address: string;
  building_neighborhood: string;
}

interface OrderVideo {
  id: string;
  slot_position: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  selected_for_display: boolean;
  video_data?: {
    nome: string;
    duracao: number;
    orientacao: string;
  };
}

export class ProfessionalPDFExporter {
  private doc: jsPDF;
  private yPosition: number = 0;
  private readonly pageWidth = 210;
  private readonly pageHeight = 297;
  private readonly margin = 20;
  private readonly contentWidth = this.pageWidth - (this.margin * 2);

  constructor() {
    this.doc = new jsPDF();
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatSimpleDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private checkPageBreak(height: number): void {
    if (this.yPosition + height > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  private drawHeader(): void {
    // Fundo do header com gradiente simulado
    this.doc.setFillColor(60, 19, 97); // indexa-purple
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // Logo da Indexa (simulado com texto estilizado)
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INDEXA', this.margin, 25);
    
    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Digital Signage Solutions', this.margin, 35);
    
    // Título do documento
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RELATÓRIO DETALHADO DO PEDIDO', this.pageWidth - this.margin - 80, 25);
    
    // Data de geração
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, this.pageWidth - this.margin - 60, 35);
    
    this.yPosition = 60;
  }

  private drawSection(title: string, icon: string = ''): void {
    this.checkPageBreak(20);
    
    // Fundo da seção
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(this.margin, this.yPosition - 5, this.contentWidth, 15, 'F');
    
    // Título da seção
    this.doc.setTextColor(60, 19, 97);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${icon} ${title}`, this.margin + 5, this.yPosition + 5);
    
    this.yPosition += 20;
  }

  private drawInfoRow(label: string, value: string, isHighlight: boolean = false): void {
    this.checkPageBreak(8);
    
    if (isHighlight) {
      this.doc.setFillColor(252, 248, 254);
      this.doc.rect(this.margin, this.yPosition - 2, this.contentWidth, 10, 'F');
    }
    
    // Label
    this.doc.setTextColor(75, 85, 99);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(label + ':', this.margin + 5, this.yPosition + 3);
    
    // Value
    this.doc.setTextColor(17, 24, 39);
    this.doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    this.doc.text(value, this.margin + 60, this.yPosition + 3);
    
    this.yPosition += 8;
  }

  private drawStatusBadge(status: string, x: number, y: number): void {
    const statusConfig = {
      'pago_pendente_video': { bg: [251, 146, 60], text: 'Aguardando Vídeo' },
      'video_enviado': { bg: [59, 130, 246], text: 'Vídeo Enviado' },
      'video_aprovado': { bg: [34, 197, 94], text: 'Vídeo Aprovado' },
      'video_rejeitado': { bg: [239, 68, 68], text: 'Vídeo Rejeitado' },
      'pago': { bg: [34, 197, 94], text: 'Pago' },
      'pendente': { bg: [107, 114, 128], text: 'Pendente' },
      'ativo': { bg: [34, 197, 94], text: 'Ativo' },
      'cancelado': { bg: [239, 68, 68], text: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
      { bg: [107, 114, 128], text: status };
    
    // Badge background
    this.doc.setFillColor(config.bg[0], config.bg[1], config.bg[2]);
    this.doc.roundedRect(x, y, 35, 8, 2, 2, 'F');
    
    // Badge text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(config.text, x + 2, y + 5);
  }

  private drawTable(headers: string[], rows: string[][]): void {
    const colWidth = this.contentWidth / headers.length;
    
    this.checkPageBreak(15 + (rows.length * 8));
    
    // Header
    this.doc.setFillColor(60, 19, 97);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 10, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      this.doc.text(header, this.margin + (index * colWidth) + 2, this.yPosition + 6);
    });
    
    this.yPosition += 10;
    
    // Rows
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 249, 250);
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, 8, 'F');
      }
      
      this.doc.setTextColor(17, 24, 39);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      
      row.forEach((cell, cellIndex) => {
        this.doc.text(cell, this.margin + (cellIndex * colWidth) + 2, this.yPosition + 5);
      });
      
      this.yPosition += 8;
    });
    
    this.yPosition += 5;
  }

  private drawFinancialSummary(order: OrderData): void {
    this.checkPageBreak(40);
    
    // Caixa destacada para resumo financeiro
    this.doc.setFillColor(252, 248, 254);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 35, 'F');
    
    this.doc.setDrawColor(60, 19, 97);
    this.doc.setLineWidth(1);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 35);
    
    // Título
    this.doc.setTextColor(60, 19, 97);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RESUMO FINANCEIRO', this.margin + 5, this.yPosition + 10);
    
    // Valores
    const subtotal = order.valor_total;
    const desconto = order.cupom_id ? subtotal * 0.1 : 0;
    const valorFinal = order.valor_total;
    
    this.doc.setTextColor(17, 24, 39);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Subtotal: ${this.formatCurrency(subtotal + desconto)}`, this.margin + 5, this.yPosition + 20);
    if (desconto > 0) {
      this.doc.text(`Desconto: -${this.formatCurrency(desconto)}`, this.margin + 5, this.yPosition + 27);
    }
    
    // Valor total destacado
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(60, 19, 97);
    this.doc.text(`TOTAL: ${this.formatCurrency(valorFinal)}`, this.margin + 100, this.yPosition + 25);
    
    this.yPosition += 40;
  }

  private drawFooter(): void {
    const footerY = this.pageHeight - 30;
    
    // Linha separadora
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);
    
    // Informações da empresa
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text('INDEXA - Digital Signage Solutions', this.margin, footerY + 8);
    this.doc.text('contato@indexa.com.br | www.indexa.com.br', this.margin, footerY + 15);
    this.doc.text('Este documento foi gerado automaticamente pelo sistema', this.margin, footerY + 22);
    
    // Número da página
    this.doc.text(`Página ${this.doc.getNumberOfPages()}`, this.pageWidth - this.margin - 20, footerY + 8);
  }

  public async generateReport(
    order: OrderData,
    panels: PanelData[],
    videos: OrderVideo[]
  ): Promise<void> {
    try {
      // Header
      this.drawHeader();
      
      // Informações do Pedido
      this.drawSection('INFORMAÇÕES DO PEDIDO', '📋');
      this.drawInfoRow('ID do Pedido', `#${order.id.substring(0, 8)}`, true);
      this.drawInfoRow('Data de Criação', this.formatDate(order.created_at));
      this.drawInfoRow('Status', '');
      this.drawStatusBadge(order.status, this.margin + 60, this.yPosition - 8);
      this.yPosition += 5;
      this.drawInfoRow('Plano Contratado', `${order.plano_meses} ${order.plano_meses === 1 ? 'mês' : 'meses'}`);
      this.drawInfoRow('Período de Vigência', `${this.formatSimpleDate(order.data_inicio)} até ${this.formatSimpleDate(order.data_fim)}`);
      
      this.yPosition += 10;
      
      // Informações do Cliente
      this.drawSection('DADOS DO CLIENTE', '👤');
      this.drawInfoRow('Nome', order.client_name, true);
      this.drawInfoRow('Email', order.client_email);
      this.drawInfoRow('Termos Aceitos', order.termos_aceitos ? 'Sim' : 'Não');
      
      this.yPosition += 10;
      
      // Resumo Financeiro
      this.drawFinancialSummary(order);
      
      // Informações de Pagamento
      if (order.log_pagamento) {
        this.drawSection('INFORMAÇÕES DE PAGAMENTO', '💳');
        this.drawInfoRow('Método', order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito');
        this.drawInfoRow('Status', order.log_pagamento.payment_status || 'N/A');
        if (order.log_pagamento.processed_at) {
          this.drawInfoRow('Processado em', new Date(order.log_pagamento.processed_at).toLocaleString('pt-BR'));
        }
        this.yPosition += 10;
      }
      
      // Painéis Contratados
      if (panels.length > 0) {
        this.drawSection('PAINÉIS CONTRATADOS', '📺');
        const panelRows = panels.map(panel => [
          panel.code,
          panel.building_name,
          panel.building_address,
          panel.building_neighborhood
        ]);
        this.drawTable(['Código', 'Prédio', 'Endereço', 'Bairro'], panelRows);
      }
      
      // Gestão de Vídeos
      if (videos.length > 0) {
        this.drawSection('GESTÃO DE VÍDEOS', '🎬');
        const videoRows = videos.map(video => [
          `Slot ${video.slot_position}`,
          video.video_data?.nome || 'N/A',
          video.approval_status === 'approved' ? 'Aprovado' : 
          video.approval_status === 'rejected' ? 'Rejeitado' : 'Pendente',
          video.is_active ? 'Ativo' : 'Inativo',
          video.selected_for_display ? 'Sim' : 'Não'
        ]);
        this.drawTable(['Slot', 'Nome do Vídeo', 'Status', 'Ativo', 'Em Exibição'], videoRows);
      }
      
      // Footer
      this.drawFooter();
      
      // Salvar o PDF
      this.doc.save(`relatorio-pedido-${order.id.substring(0, 8)}.pdf`);
      
      toast.success('Relatório profissional exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar o relatório PDF');
    }
  }
}
