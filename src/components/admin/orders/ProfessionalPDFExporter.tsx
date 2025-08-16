
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
  nome: string;
  endereco: string;
  bairro: string;
}

interface OrderVideo {
  id: string;
  slot_position: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  selected_for_display: boolean;
  created_at?: string;
  uploaded_at?: string;
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
  private readonly margin = 25;
  private readonly contentWidth = this.pageWidth - (this.margin * 2);
  private readonly maxTextWidth = this.contentWidth - 10;
  private emittedAt: string = '';

  constructor() {
    this.doc = new jsPDF();
    this.emittedAt = this.getNowPTBR();
  }

  private getNowPTBR(): string {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private timestampFileSuffix(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}`;
  }

  private async loadImageAsDataURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
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
    if (this.yPosition + height > this.pageHeight - this.margin - 25) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  private wrapText(text: string, maxWidth: number, fontSize: number = 10): string[] {
    this.doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.doc.getTextWidth(testLine);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // If a single word is too long, split it
          lines.push(word.substring(0, Math.floor(word.length * maxWidth / testWidth)));
          currentLine = word.substring(Math.floor(word.length * maxWidth / testWidth));
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [text];
  }

  private async drawHeader(): Promise<void> {
    // Fundo do header
    this.doc.setFillColor(60, 19, 97);
    this.doc.rect(0, 0, this.pageWidth, 55, 'F');
    
    // Tentar carregar logo EXA
    let drewLogo = false;
    try {
      const logoUrl = '/exa-logo.png';
      const dataUrl = await this.loadImageAsDataURL(logoUrl);
      // Calcular proporção correta da logo para evitar distorção
      const logoH = 18;
      const logoW = logoH * 3.5; // Proporção aproximada da logo EXA
      this.doc.addImage(dataUrl, 'PNG', this.margin, 18, logoW, logoH);
      drewLogo = true;
    } catch (error) {
      console.log('Logo não carregada, usando fallback');
    }
    
    if (!drewLogo) {
      // Fallback - texto EXA
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(24);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('EXA', this.margin, 32);
    }
    
    // Subtitle
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Publicidade Inteligente', this.margin, drewLogo ? 45 : 42);
    
    // Título do documento
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    const titleText = 'RELATÓRIO DETALHADO DO PEDIDO';
    const titleWidth = this.doc.getTextWidth(titleText);
    this.doc.text(titleText, this.pageWidth - this.margin - titleWidth, 26);
    
    // Data de emissão
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    const emittedText = `Emitido em: ${this.emittedAt}`;
    const emittedWidth = this.doc.getTextWidth(emittedText);
    this.doc.text(emittedText, this.pageWidth - this.margin - emittedWidth, 40);
    
    this.yPosition = 65;
  }

  private drawSection(title: string): void {
    this.checkPageBreak(28);
    
    // Fundo da seção
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(this.margin, this.yPosition - 4, this.contentWidth, 20, 'F');
    
    // Barra vertical roxa como marcador
    this.doc.setFillColor(60, 19, 97);
    this.doc.rect(this.margin + 2, this.yPosition - 2, 3, 16, 'F');
    
    // Título da seção
    this.doc.setTextColor(60, 19, 97);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 8, this.yPosition + 9);
    
    this.yPosition += 26;
  }

  private drawInfoRow(label: string, value: string, isHighlight: boolean = false): void {
    this.checkPageBreak(10);
    
    if (isHighlight) {
      this.doc.setFillColor(252, 248, 254);
      this.doc.rect(this.margin, this.yPosition - 2, this.contentWidth, 12, 'F');
    }
    
    // Label
    this.doc.setTextColor(75, 85, 99);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(label + ':', this.margin + 5, this.yPosition + 5);
    
    // Value - com quebra de linha se necessário
    this.doc.setTextColor(17, 24, 39);
    this.doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    
    const valueLines = this.wrapText(value, this.maxTextWidth - 65, 10);
    valueLines.forEach((line, index) => {
      this.doc.text(line, this.margin + 65, this.yPosition + 5 + (index * 6));
    });
    
    this.yPosition += Math.max(10, valueLines.length * 6 + 4);
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
    // Cálculo dinâmico de largura das colunas
    const baseColWidth = this.contentWidth / headers.length;
    const minColWidth = 25;
    const maxColWidth = this.contentWidth * 0.4;
    
    const colWidths = headers.map(() => Math.max(minColWidth, Math.min(maxColWidth, baseColWidth)));
    
    this.checkPageBreak(20 + (rows.length * 12));
    
    // Header
    this.doc.setFillColor(60, 19, 97);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 12, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    
    let currentX = this.margin;
    headers.forEach((header, index) => {
      const headerLines = this.wrapText(header, colWidths[index] - 4, 9);
      headerLines.forEach((line, lineIndex) => {
        this.doc.text(line, currentX + 2, this.yPosition + 7 + (lineIndex * 4));
      });
      currentX += colWidths[index];
    });
    
    this.yPosition += 15;
    
    // Rows
    rows.forEach((row, rowIndex) => {
      const maxLinesInRow = Math.max(...row.map((cell, cellIndex) => 
        this.wrapText(cell, colWidths[cellIndex] - 4, 8).length
      ));
      const rowHeight = Math.max(10, maxLinesInRow * 5 + 2);
      
      this.checkPageBreak(rowHeight);
      
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 249, 250);
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');
      }
      
      this.doc.setTextColor(17, 24, 39);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      
      let currentX = this.margin;
      row.forEach((cell, cellIndex) => {
        const cellLines = this.wrapText(cell, colWidths[cellIndex] - 4, 8);
        cellLines.forEach((line, lineIndex) => {
          this.doc.text(line, currentX + 2, this.yPosition + 6 + (lineIndex * 5));
        });
        currentX += colWidths[cellIndex];
      });
      
      this.yPosition += rowHeight;
    });
    
    this.yPosition += 8;
  }

  private drawFinancialSummary(order: OrderData): void {
    this.checkPageBreak(45);
    
    // Caixa destacada para resumo financeiro
    this.doc.setFillColor(252, 248, 254);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 40, 'F');
    
    this.doc.setDrawColor(60, 19, 97);
    this.doc.setLineWidth(1);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 40);
    
    // Título
    this.doc.setTextColor(60, 19, 97);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RESUMO FINANCEIRO', this.margin + 8, this.yPosition + 12);
    
    // Valores
    const subtotal = order.valor_total;
    const desconto = order.cupom_id ? subtotal * 0.1 : 0;
    const valorFinal = order.valor_total;
    
    this.doc.setTextColor(17, 24, 39);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Subtotal: ${this.formatCurrency(subtotal + desconto)}`, this.margin + 8, this.yPosition + 22);
    if (desconto > 0) {
      this.doc.text(`Desconto: -${this.formatCurrency(desconto)}`, this.margin + 8, this.yPosition + 30);
    }
    
    // Valor total destacado - posicionamento responsivo
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(60, 19, 97);
    const totalText = `TOTAL: ${this.formatCurrency(valorFinal)}`;
    const totalWidth = this.doc.getTextWidth(totalText);
    this.doc.text(totalText, this.pageWidth - this.margin - totalWidth - 8, this.yPosition + 30);
    
    this.yPosition += 48;
  }

  private addFootersOnAllPages(): void {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      const footerY = this.pageHeight - 40; // Aumentar margem inferior
      
      // Linha separadora
      this.doc.setDrawColor(229, 231, 235);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);
      
      // Informações da empresa
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      
      // Primeira linha - nome da empresa
      this.doc.text('EXA - Publicidade Inteligente', this.margin, footerY + 10);
      
      // Segunda linha - contatos (verificar se cabem na página)
      const contactText = 'contato@exa.com.br | www.exa.com.br';
      const contactWidth = this.doc.getTextWidth(contactText);
      if (this.margin + contactWidth <= this.pageWidth - this.margin) {
        this.doc.text(contactText, this.margin, footerY + 18);
      } else {
        // Se não caber, quebrar em duas linhas
        this.doc.text('contato@exa.com.br', this.margin, footerY + 18);
        this.doc.text('www.exa.com.br', this.margin, footerY + 26);
      }
      
      // Data de emissão
      const emittedText = `Emitido em: ${this.emittedAt}`;
      this.doc.text(emittedText, this.margin, footerY + 26);
      
      // Paginação - lado direito
      const pageText = `Página ${i} de ${totalPages}`;
      const pageWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY + 10);
    }
  }

  public async generateReport(
    order: OrderData,
    panels: PanelData[],
    videos: OrderVideo[]
  ): Promise<void> {
    try {
      // Header
      await this.drawHeader();
      
      // Informações do Pedido
      this.drawSection('INFORMAÇÕES DO PEDIDO');
      this.drawInfoRow('ID do Pedido', `#${order.id.substring(0, 8)}`, true);
      this.drawInfoRow('Data de Criação', this.formatDate(order.created_at));
      this.drawInfoRow('Status', '');
      this.drawStatusBadge(order.status, this.margin + 60, this.yPosition - 8);
      this.yPosition += 5;
      this.drawInfoRow('Plano Contratado', `${order.plano_meses} ${order.plano_meses === 1 ? 'mês' : 'meses'}`);
      this.drawInfoRow('Período de Vigência', `${this.formatSimpleDate(order.data_inicio)} até ${this.formatSimpleDate(order.data_fim)}`);
      
      this.yPosition += 10;
      
      // Dados do Cliente
      this.drawSection('DADOS DO CLIENTE');
      this.drawInfoRow('Nome', order.client_name, true);
      this.drawInfoRow('Email', order.client_email);
      this.drawInfoRow('Termos Aceitos', order.termos_aceitos ? 'Sim' : 'Não');
      
      this.yPosition += 10;
      
      // Resumo Financeiro
      this.drawFinancialSummary(order);
      
      // Informações de Pagamento
      if (order.log_pagamento) {
        this.drawSection('INFORMAÇÕES DE PAGAMENTO');
        this.drawInfoRow('Método', order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito');
        this.drawInfoRow('Status', order.log_pagamento.payment_status || 'N/A');
        if (order.log_pagamento.processed_at) {
          this.drawInfoRow('Processado em', new Date(order.log_pagamento.processed_at).toLocaleString('pt-BR'));
        }
        this.yPosition += 10;
      }
      
      // Locais Contratados
      if (panels.length > 0) {
        this.drawSection('LOCAIS CONTRATADOS');
        const panelRows = panels.map(building => [
          building.id.substring(0, 8),
          building.nome,
          building.endereco,
          building.bairro
        ]);
        this.drawTable(['ID', 'Nome', 'Endereço', 'Bairro'], panelRows);
      }
      
      // Relatório de Vídeos Enviados - SEMPRE PRESENTE
      this.drawSection('RELATÓRIO DE VÍDEOS ENVIADOS');
      if (videos.length === 0) {
        this.doc.setTextColor(107, 114, 128);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.doc.text('Nenhum vídeo enviado até o momento.', this.margin + 6, this.yPosition + 6);
        this.yPosition += 16;
      } else {
        const videoRows = videos.map(video => [
          `Slot ${video.slot_position}`,
          video.video_data?.nome || 'N/A',
          video.uploaded_at ? this.formatDate(video.uploaded_at) : 
          video.created_at ? this.formatDate(video.created_at) : 'N/A',
          video.video_data?.duracao != null ? `${video.video_data?.duracao}s` : 'N/A',
          video.video_data?.orientacao || 'N/A',
          video.approval_status === 'approved' ? 'Aprovado' : 
          video.approval_status === 'rejected' ? 'Rejeitado' : 'Pendente',
          video.is_active ? 'Ativo' : 'Inativo',
          video.selected_for_display ? 'Sim' : 'Não'
        ]);
        this.drawTable([
          'Slot',
          'Nome do Vídeo',
          'Enviado em',
          'Duração',
          'Orientação',
          'Status',
          'Ativo',
          'Exibição'
        ], videoRows);
      }
      
      // Adicionar rodapés em todas as páginas
      this.addFootersOnAllPages();
      
      // Salvar o PDF com nome padronizado
      const filename = `relatorio-pedido-${order.id.substring(0, 8)}-${this.timestampFileSuffix()}.pdf`;
      this.doc.save(filename);
      
      toast.success('Relatório profissional exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar o relatório PDF');
    }
  }
}
