
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import QRCode from 'qrcode';

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
  private readonly margin = 15;
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

  private getOrderNumber(orderId: string, createdAt: string): string {
    // Extrair ano da data de criação
    const year = new Date(createdAt).getFullYear();
    // Pegar os últimos 3 dígitos do UUID como número sequencial
    const idPart = orderId.replace(/-/g, '').substring(0, 8);
    const numericPart = parseInt(idPart, 16) % 1000; // Gera número de 0-999
    const sequentialNumber = (numericPart + 1).toString().padStart(3, '0');
    return `${year}-${sequentialNumber}`;
  }

  private sanitizeFileName(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9]/g, '-')   // Substitui caracteres especiais por hífen
      .replace(/-+/g, '-')              // Remove hífens duplicados
      .toLowerCase();
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
    // Header compacto - Vermelho EXA
    this.doc.setFillColor(156, 30, 30);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Logo EXA bem posicionada
    let drewLogo = false;
    const logoSize = 24;
    const logoX = this.margin;
    const logoY = 8;
    
    try {
      const logoUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';
      const dataUrl = await this.loadImageAsDataURL(logoUrl);
      this.doc.addImage(dataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
      drewLogo = true;
    } catch (error) {
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('EXA', logoX, 20);
    }
    
    // Subtitle ao lado da logo
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    const subtitleX = logoX + logoSize + 3; // 3mm de espaço após a logo
    const subtitleY = logoY + (logoSize / 2) + 2; // Centralizado verticalmente com a logo
    this.doc.text('Publicidade Inteligente', subtitleX, subtitleY);
    
    // Título - centro superior
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    const titleText = 'RELATÓRIO DETALHADO DO PEDIDO';
    const titleWidth = this.doc.getTextWidth(titleText);
    this.doc.text(titleText, (this.pageWidth - titleWidth) / 2, 18);
    
    // Data de emissão - lado direito
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'normal');
    const emittedText = `Emitido em: ${this.emittedAt}`;
    const emittedWidth = this.doc.getTextWidth(emittedText);
    this.doc.text(emittedText, this.pageWidth - this.margin - emittedWidth, 26);
    
    // Adicionar metadata de proteção
    this.doc.setProperties({
      title: 'Relatório EXA - Documento Protegido',
      subject: 'Relatório de Pedido',
      author: 'EXA - Publicidade Inteligente',
      keywords: 'pedido, relatório, exa',
      creator: 'Sistema EXA'
    });
    
    this.yPosition = 40;
  }

  private drawOrderNumber(order: OrderData): void {
    // Número do pedido destacado
    const orderNumber = this.getOrderNumber(order.id, order.created_at);
    
    this.doc.setFillColor(254, 242, 242);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 12, 'F');
    
    this.doc.setDrawColor(156, 30, 30);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 12);
    
    this.doc.setTextColor(156, 30, 30);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`PEDIDO Nº ${orderNumber}`, this.margin + 3, this.yPosition + 7);
    
    // Info do cliente ao lado
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99);
    const clientInfo = `Cliente: ${order.client_name} | ${this.formatCurrency(order.valor_total)}`;
    const clientInfoWidth = this.doc.getTextWidth(clientInfo);
    this.doc.text(clientInfo, this.pageWidth - this.margin - clientInfoWidth - 3, this.yPosition + 7);
    
    this.yPosition += 16;
  }

  private drawSection(title: string): void {
    this.checkPageBreak(14);
    
    // Fundo cinza claro compacto
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(this.margin, this.yPosition - 1, this.contentWidth, 10, 'F');
    
    // Borda superior
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.yPosition - 1, this.pageWidth - this.margin, this.yPosition - 1);
    
    // Título da seção
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 2, this.yPosition + 5);
    
    this.yPosition += 12;
  }

  private drawInfoRow(label: string, value: string, isHighlight: boolean = false): void {
    this.checkPageBreak(6);
    
    if (isHighlight) {
      this.doc.setFillColor(254, 242, 242);
      this.doc.rect(this.margin, this.yPosition - 0.5, this.contentWidth, 6, 'F');
    }
    
    // Label
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(label + ':', this.margin + 2, this.yPosition + 3);
    
    // Value
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    
    const valueLines = this.wrapText(value, this.maxTextWidth - 40, 7);
    valueLines.forEach((line, index) => {
      this.doc.text(line, this.margin + 42, this.yPosition + 3 + (index * 4));
    });
    
    this.yPosition += Math.max(6, valueLines.length * 4 + 1);
  }

  private drawStatusBadge(status: string, x: number, y: number): void {
    const statusConfig = {
      'pago_pendente_video': { bg: [251, 146, 60], text: 'Aguard. Vídeo' },
      'video_enviado': { bg: [59, 130, 246], text: 'Vídeo Enviado' },
      'video_aprovado': { bg: [34, 197, 94], text: 'Aprovado' },
      'video_rejeitado': { bg: [239, 68, 68], text: 'Rejeitado' },
      'pago': { bg: [34, 197, 94], text: 'Pago' },
      'pendente': { bg: [107, 114, 128], text: 'Pendente' },
      'ativo': { bg: [34, 197, 94], text: 'Ativo' },
      'cancelado': { bg: [239, 68, 68], text: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
      { bg: [107, 114, 128], text: status };
    
    // Badge compacto
    this.doc.setFillColor(config.bg[0], config.bg[1], config.bg[2]);
    this.doc.roundedRect(x, y, 28, 5, 1, 1, 'F');
    
    // Badge text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(config.text, x + 2, y + 3.5);
  }

  private drawTable(headers: string[], rows: string[][]): void {
    const baseColWidth = this.contentWidth / headers.length;
    const minColWidth = 18;
    const maxColWidth = this.contentWidth * 0.3;
    
    const colWidths = headers.map(() => Math.max(minColWidth, Math.min(maxColWidth, baseColWidth)));
    
    this.checkPageBreak(12 + (rows.length * 6));
    
    // Header da tabela
    this.doc.setFillColor(75, 85, 99);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 6, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'bold');
    
    let currentX = this.margin;
    headers.forEach((header, index) => {
      this.doc.text(header, currentX + 1.5, this.yPosition + 4);
      currentX += colWidths[index];
    });
    
    this.yPosition += 8;
    
    // Linhas da tabela - ultra compactas
    rows.forEach((row, rowIndex) => {
      const rowHeight = 5;
      
      this.checkPageBreak(rowHeight);
      
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(249, 250, 251);
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');
      }
      
      this.doc.setTextColor(31, 41, 55);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      
      let currentX = this.margin;
      row.forEach((cell, cellIndex) => {
        const cellText = cell.length > 30 ? cell.substring(0, 27) + '...' : cell;
        this.doc.text(cellText, currentX + 1.5, this.yPosition + 3.5);
        currentX += colWidths[cellIndex];
      });
      
      this.yPosition += rowHeight;
    });
    
    this.yPosition += 4;
  }

  private drawFinancialSummary(order: OrderData): void {
    this.checkPageBreak(22);
    
    // Caixa compacta para resumo financeiro
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 18, 'F');
    
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 18);
    
    // Título
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RESUMO FINANCEIRO', this.margin + 2, this.yPosition + 5);
    
    // Valores
    const subtotal = order.valor_total;
    const desconto = order.cupom_id ? subtotal * 0.1 : 0;
    const valorFinal = order.valor_total;
    
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'normal');
    
    let yOffset = 10;
    this.doc.text(`Subtotal: ${this.formatCurrency(subtotal + desconto)}`, this.margin + 2, this.yPosition + yOffset);
    if (desconto > 0) {
      yOffset += 4;
      this.doc.text(`Desconto: -${this.formatCurrency(desconto)}`, this.margin + 2, this.yPosition + yOffset);
    }
    
    // Valor total - lado direito
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(156, 30, 30);
    const totalText = `TOTAL: ${this.formatCurrency(valorFinal)}`;
    const totalWidth = this.doc.getTextWidth(totalText);
    this.doc.text(totalText, this.pageWidth - this.margin - totalWidth - 2, this.yPosition + 13);
    
    this.yPosition += 22;
  }

  private async addFootersOnAllPages(order: OrderData): Promise<void> {
    const totalPages = this.doc.getNumberOfPages();
    
    // Gerar QR Code para validação - usando domínio de produção
    const validationUrl = `https://examidia.com.br/validate-order?order=${order.id}`;
    let qrDataUrl = '';
    
    try {
      qrDataUrl = await QRCode.toDataURL(validationUrl, { 
        width: 200, 
        margin: 1,
        errorCorrectionLevel: 'M'
      });
      console.log('QR Code generated for URL:', validationUrl);
    } catch (error) {
      console.error('QR Code generation failed:', error);
    }
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      const footerY = this.pageHeight - 35;
      
      // Linha separadora minimalista
      this.doc.setDrawColor(229, 231, 235);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);
      
      // QR Code - lado esquerdo
      if (qrDataUrl) {
        this.doc.addImage(qrDataUrl, 'PNG', this.margin, footerY + 3, 25, 25);
      }
      
      // Informações da empresa - centro
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      
      this.doc.text('EXA - Publicidade Inteligente', this.margin + 30, footerY + 8);
      this.doc.text('www.examidia.com.br', this.margin + 30, footerY + 14);
      
      // Instruções de validação
      this.doc.setFontSize(6);
      this.doc.setTextColor(156, 30, 30);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Valide este documento:', this.margin + 30, footerY + 20);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('Escaneie o QR Code', this.margin + 30, footerY + 24);
      
      // Paginação - lado direito
      const pageText = `Pág. ${i}/${totalPages}`;
      const pageWidth = this.doc.getTextWidth(pageText);
      this.doc.setFontSize(7);
      this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY + 8);
      
      // Data de emissão - lado direito
      const emittedText = `Emitido: ${this.emittedAt}`;
      const emittedWidth = this.doc.getTextWidth(emittedText);
      this.doc.text(emittedText, this.pageWidth - this.margin - emittedWidth, footerY + 14);
      
      // Marca de proteção
      this.doc.setFontSize(6);
      this.doc.setTextColor(200, 200, 200);
      const protectionText = '🔒 Documento Protegido';
      const protectionWidth = this.doc.getTextWidth(protectionText);
      this.doc.text(protectionText, this.pageWidth - this.margin - protectionWidth, footerY + 20);
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
      
      // Número do pedido destacado
      this.drawOrderNumber(order);
      
      // Informações do Pedido
      this.drawSection('INFORMAÇÕES DO PEDIDO');
      this.drawInfoRow('ID do Pedido', `#${order.id.substring(0, 8)}`, true);
      this.drawInfoRow('Data de Criação', this.formatDate(order.created_at));
      this.drawInfoRow('Status', '');
      this.drawStatusBadge(order.status, this.margin + 40, this.yPosition - 5);
      this.yPosition += 3;
      this.drawInfoRow('Plano Contratado', `${order.plano_meses} ${order.plano_meses === 1 ? 'mês' : 'meses'}`);
      this.drawInfoRow('Período de Vigência', `${this.formatSimpleDate(order.data_inicio)} até ${this.formatSimpleDate(order.data_fim)}`);
      
      this.yPosition += 5;
      
      // Dados do Cliente
      this.drawSection('DADOS DO CLIENTE');
      this.drawInfoRow('Nome', order.client_name, true);
      this.drawInfoRow('Email', order.client_email);
      this.drawInfoRow('Termos Aceitos', order.termos_aceitos ? 'Sim' : 'Não');
      
      this.yPosition += 5;
      
      // Resumo Financeiro
      this.drawFinancialSummary(order);
      
      // Informações de Pagamento
      if (order.log_pagamento) {
        this.drawSection('INFORMAÇÕES DE PAGAMENTO');
        this.drawInfoRow('Método', order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão');
        this.drawInfoRow('Status', order.log_pagamento.payment_status || 'N/A');
        this.yPosition += 5;
      }
      
      // Locais Contratados
      if (panels.length > 0) {
        this.drawSection('LOCAIS CONTRATADOS');
        const panelRows = panels.slice(0, 3).map(building => [
          building.id.substring(0, 6),
          building.nome.substring(0, 25),
          building.endereco.substring(0, 30),
          building.bairro.substring(0, 15)
        ]);
        this.drawTable(['ID', 'Nome', 'Endereço', 'Bairro'], panelRows);
        if (panels.length > 3) {
          this.doc.setTextColor(107, 114, 128);
          this.doc.setFontSize(6);
          this.doc.text(`... e mais ${panels.length - 3} locais`, this.margin + 2, this.yPosition);
          this.yPosition += 4;
        }
      }
      
      // Vídeos
      if (videos.length > 0) {
        this.drawSection('VÍDEOS');
        const videoRows = videos.slice(0, 2).map(video => [
          `Slot ${video.slot_position}`,
          (video.video_data?.nome || 'N/A').substring(0, 20),
          video.approval_status === 'approved' ? 'Aprovado' : 
          video.approval_status === 'rejected' ? 'Rejeitado' : 'Pendente',
          video.is_active ? 'Ativo' : 'Inativo'
        ]);
        this.drawTable(['Slot', 'Nome', 'Status', 'Ativo'], videoRows);
        if (videos.length > 2) {
          this.doc.setTextColor(107, 114, 128);
          this.doc.setFontSize(6);
          this.doc.text(`... e mais ${videos.length - 2} vídeos`, this.margin + 2, this.yPosition);
        }
      }
      
      // Adicionar rodapés em todas as páginas com QR Code
      await this.addFootersOnAllPages(order);
      
      // Gerar número de pedido formatado
      const orderNumber = this.getOrderNumber(order.id, order.created_at);
      
      // Nome do arquivo profissional
      const clientName = this.sanitizeFileName(order.client_name);
      const filename = `pedido-${orderNumber}-${clientName}.pdf`;
      
      this.doc.save(filename);
      
      toast.success(`Relatório #${orderNumber} exportado com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar o relatório PDF');
    }
  }
}
