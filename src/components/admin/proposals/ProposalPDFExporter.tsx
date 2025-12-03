import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface ProposalData {
  id: string;
  number: string;
  client_name: string;
  client_company_name?: string | null;
  client_country?: 'BR' | 'AR' | 'PY' | null;
  client_cnpj: string | null;
  client_phone: string | null;
  client_email: string | null;
  selected_buildings: any[];
  total_panels: number;
  total_impressions_month: number;
  fidel_monthly_value: number;
  cash_total_value: number;
  discount_percent: number;
  duration_months: number;
  status: string;
  created_at: string;
  expires_at: string | null;
}

// EXA Logo em base64 (versão simplificada para PDF - vermelha)
const EXA_LOGO_BASE64 = 'data:image/png;base64,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';

export class ProposalPDFExporter {
  private doc: jsPDF;
  private yPosition: number = 0;
  private readonly pageWidth = 210;
  private readonly pageHeight = 297;
  private readonly margin = 15;
  private readonly contentWidth = this.pageWidth - (this.margin * 2);

  // Cores elegantes para impressão
  private readonly colors = {
    exaRed: { r: 156, g: 30, b: 30 },
    darkGray: { r: 31, g: 41, b: 55 },
    mediumGray: { r: 107, g: 114, b: 128 },
    lightGray: { r: 243, g: 244, b: 246 },
    white: { r: 255, g: 255, b: 255 },
    success: { r: 16, g: 185, b: 129 },
    tableHeader: { r: 55, g: 65, b: 81 },
  };

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
      year: 'numeric'
    });
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

  private async generateValidationQRCode(proposalId: string): Promise<string> {
    const validationUrl = `https://64f6806c-c0e0-422b-b85f-955fd5719544.lovableproject.com/propostacomercial/${proposalId}`;
    return await QRCode.toDataURL(validationUrl, {
      width: 100,
      margin: 1,
      color: { dark: '#1F2937', light: '#FFFFFF' }
    });
  }

  private checkPageBreak(height: number): boolean {
    if (this.yPosition + height > this.pageHeight - 50) {
      this.doc.addPage();
      this.yPosition = this.margin + 5;
      return true;
    }
    return false;
  }

  private setColor(color: { r: number; g: number; b: number }, type: 'fill' | 'text' | 'draw' = 'text'): void {
    if (type === 'fill') {
      this.doc.setFillColor(color.r, color.g, color.b);
    } else if (type === 'draw') {
      this.doc.setDrawColor(color.r, color.g, color.b);
    } else {
      this.doc.setTextColor(color.r, color.g, color.b);
    }
  }

  private async drawElegantHeader(proposal: ProposalData, sellerName: string, isCortesia: boolean = false): Promise<void> {
    // Fundo branco limpo
    this.setColor(this.colors.white, 'fill');
    this.doc.rect(0, 0, this.pageWidth, 42, 'F');
    
    // Logo EXA - carrega da URL e mantém proporção original
    try {
      const logoUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';
      const dataUrl = await this.loadImageAsDataURL(logoUrl);
      // Logo com altura fixa e largura proporcional (a logo EXA é mais larga que alta)
      // Usando altura de 22mm e largura automática baseada na proporção real ~1.5:1
      this.doc.addImage(dataUrl, 'PNG', this.margin, 10, 35, 22);
    } catch {
      // Fallback: texto EXA estilizado
      this.setColor(this.colors.exaRed);
      this.doc.setFontSize(24);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('EXA', this.margin + 5, 26);
    }
    
    // Título central
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    
    const title = isCortesia ? 'PRESENTE CORTESIA' : 'PROPOSTA COMERCIAL';
    this.doc.text(title, this.pageWidth / 2, 16, { align: 'center' });
    
    // Subtítulo
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Publicidade Inteligente em Elevadores', this.pageWidth / 2, 24, { align: 'center' });
    
    // Data e vendedor no lado direito
    const rightX = this.pageWidth - this.margin;
    this.doc.setFontSize(8);
    this.setColor(this.colors.mediumGray);
    this.doc.text(`Emitido: ${this.formatDate(proposal.created_at)}`, rightX, 12, { align: 'right' });
    
    this.setColor(this.colors.exaRed);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Vendedor: ${sellerName}`, rightX, 20, { align: 'right' });
    
    // Linha separadora elegante (vermelho EXA fino)
    this.setColor(this.colors.exaRed, 'draw');
    this.doc.setLineWidth(1.5);
    this.doc.line(this.margin, 40, this.pageWidth - this.margin, 40);
    
    this.yPosition = 48;
  }

  private drawProposalIdentification(proposal: ProposalData, isCortesia: boolean = false): void {
    // Box com número da proposta
    this.setColor(this.colors.lightGray, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 14, 3, 3, 'F');
    
    // Borda sutil
    this.setColor(this.colors.mediumGray, 'draw');
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 14, 3, 3);
    
    // Número
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    const prefix = isCortesia ? '🎁 Cortesia' : 'Proposta';
    this.doc.text(`${prefix} ${proposal.number}`, this.margin + 5, this.yPosition + 9);
    
    // Status badge
    const statusConfig: Record<string, { bg: { r: number; g: number; b: number }; text: string }> = {
      'enviada': { bg: { r: 59, g: 130, b: 246 }, text: 'ENVIADA' },
      'visualizada': { bg: { r: 147, g: 51, b: 234 }, text: 'VISUALIZADA' },
      'aceita': { bg: { r: 16, g: 185, b: 129 }, text: 'ACEITA' },
      'recusada': { bg: { r: 239, g: 68, b: 68 }, text: 'RECUSADA' },
      'expirada': { bg: { r: 107, g: 114, b: 128 }, text: 'EXPIRADA' },
      'pendente': { bg: { r: 245, g: 158, b: 11 }, text: 'PENDENTE' },
    };
    
    const config = statusConfig[proposal.status] || { bg: this.colors.mediumGray, text: proposal.status.toUpperCase() };
    const badgeX = this.pageWidth - this.margin - 32;
    
    this.setColor(config.bg, 'fill');
    this.doc.roundedRect(badgeX, this.yPosition + 3, 28, 8, 2, 2, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    const textWidth = this.doc.getTextWidth(config.text);
    this.doc.text(config.text, badgeX + 14 - textWidth / 2, this.yPosition + 8.5);
    
    this.yPosition += 20;
  }

  private drawSectionTitle(title: string, icon?: string): void {
    this.checkPageBreak(12);
    
    // Linha superior
    this.setColor(this.colors.exaRed, 'draw');
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition, this.margin + 3, this.yPosition);
    
    // Título
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    const displayTitle = icon ? `${icon} ${title}` : title;
    this.doc.text(displayTitle, this.margin + 5, this.yPosition + 4);
    
    // Linha após título
    const titleWidth = this.doc.getTextWidth(displayTitle);
    this.doc.line(this.margin + 8 + titleWidth, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    
    this.yPosition += 10;
  }

  private getDocumentLabel(country?: 'BR' | 'AR' | 'PY' | null): string {
    switch (country) {
      case 'BR': return 'CNPJ';
      case 'AR': return 'CUIT';
      case 'PY': return 'RUC';
      default: return 'CNPJ/Documento';
    }
  }

  private drawClientInfo(proposal: ProposalData, isCortesia: boolean = false): void {
    this.drawSectionTitle(isCortesia ? 'PRESENTEADO' : 'DADOS DO CLIENTE');
    
    const startY = this.yPosition;
    const colWidth = this.contentWidth / 2;
    
    // Determinar label do documento baseado no país
    const documentLabel = this.getDocumentLabel(proposal.client_country);
    
    // Layout em duas colunas - agora com 3 linhas
    const leftItems = [
      { label: 'Nome do Contato', value: proposal.client_name },
      { label: 'Nome da Empresa', value: proposal.client_company_name || 'Não informado' },
      { label: documentLabel, value: proposal.client_cnpj || 'Não informado' },
    ];
    
    const rightItems = [
      { label: 'Telefone', value: proposal.client_phone || 'Não informado' },
      { label: 'E-mail', value: proposal.client_email || 'Não informado' },
      { label: 'País', value: proposal.client_country === 'AR' ? '🇦🇷 Argentina' : proposal.client_country === 'PY' ? '🇵🇾 Paraguai' : '🇧🇷 Brasil' },
    ];
    
    // Coluna esquerda
    leftItems.forEach((item, index) => {
      const y = startY + (index * 10);
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.label, this.margin, y + 4);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.value, this.margin, y + 10);
    });
    
    // Coluna direita
    rightItems.forEach((item, index) => {
      const y = startY + (index * 10);
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.label, this.margin + colWidth, y + 4);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      const value = item.value.length > 35 ? item.value.substring(0, 35) + '...' : item.value;
      this.doc.text(value, this.margin + colWidth, y + 10);
    });
    
    this.yPosition = startY + 35;
  }

  private drawBuildingsTable(buildings: any[]): void {
    const totalPanels = buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0);
    const totalImpressions = buildings.reduce((sum: number, b: any) => sum + (b.visualizacoes_mes || 0), 0);
    
    this.drawSectionTitle(`LOCAIS INCLUÍDOS (${buildings.length} prédios • ${totalPanels} telas)`);
    
    // Header da tabela
    this.setColor(this.colors.tableHeader, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 8, 1, 1, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    
    const cols = [
      { label: 'PRÉDIO', x: this.margin + 3, w: 58 },
      { label: 'BAIRRO', x: this.margin + 63, w: 35 },
      { label: 'ENDEREÇO', x: this.margin + 100, w: 45 },
      { label: 'TELAS', x: this.margin + 147, w: 15 },
      { label: 'IMP/MÊS', x: this.margin + 163, w: 18 }
    ];
    
    cols.forEach(col => {
      this.doc.text(col.label, col.x, this.yPosition + 5.5);
    });
    
    this.yPosition += 10;
    
    // Linhas da tabela com zebra
    buildings.forEach((b, index) => {
      this.checkPageBreak(8);
      
      if (index % 2 === 0) {
        this.setColor(this.colors.lightGray, 'fill');
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, 7, 'F');
      }
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      
      const nome = (b.building_name || b.nome || '').substring(0, 28);
      const bairro = (b.bairro || '').substring(0, 16);
      const endereco = (b.endereco || '').substring(0, 22);
      const telas = b.quantidade_telas || 1;
      const imp = b.visualizacoes_mes || 0;
      
      this.doc.text(nome, cols[0].x, this.yPosition + 5);
      this.doc.text(bairro, cols[1].x, this.yPosition + 5);
      this.doc.text(endereco, cols[2].x, this.yPosition + 5);
      this.doc.text(String(telas), cols[3].x, this.yPosition + 5);
      this.doc.text(imp.toLocaleString('pt-BR'), cols[4].x, this.yPosition + 5);
      
      this.yPosition += 7;
    });
    
    // Linha de totais
    this.setColor(this.colors.exaRed, 'fill');
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 8, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    
    this.doc.text('TOTAIS', cols[0].x, this.yPosition + 5.5);
    this.doc.text(String(totalPanels), cols[3].x, this.yPosition + 5.5);
    this.doc.text(totalImpressions.toLocaleString('pt-BR'), cols[4].x, this.yPosition + 5.5);
    
    this.yPosition += 14;
  }

  private drawCommercialConditions(proposal: ProposalData, isCortesia: boolean = false, baseTotalValue: number = 0): void {
    this.checkPageBreak(110);
    
    this.drawSectionTitle('CONDIÇÕES COMERCIAIS');
    
    const totalFidelidade = proposal.fidel_monthly_value * proposal.duration_months;
    const monthlyEquivalent = proposal.cash_total_value / proposal.duration_months;
    
    // Calcular o preço normal do site (sem desconto de proposta)
    // baseTotalValue já vem calculado como o valor base mensal * meses
    const normalSitePrice = baseTotalValue > 0 ? baseTotalValue : totalFidelidade * 1.25; // Fallback se não tiver baseTotalValue
    const savingsAmount = normalSitePrice - proposal.cash_total_value;
    const savingsPercent = normalSitePrice > 0 ? ((savingsAmount / normalSitePrice) * 100).toFixed(0) : '0';
    
    const innerPadding = 5;
    
    if (isCortesia) {
      // Container principal para cortesia
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 55, 3, 3, 'F');
      
      const boxWidth = (this.contentWidth - innerPadding * 3) / 2;
      
      // Box esquerdo - Valor original
      const leftX = this.margin + innerPadding;
      this.setColor(this.colors.white, 'fill');
      this.doc.roundedRect(leftX, this.yPosition + innerPadding, boxWidth, 45, 2, 2, 'F');
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Se fosse pago seria:', leftX + 5, this.yPosition + 15);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      const strikeValue = this.formatCurrency(baseTotalValue);
      this.doc.text(strikeValue, leftX + 5, this.yPosition + 28);
      
      // Strikethrough
      const strikeWidth = this.doc.getTextWidth(strikeValue);
      this.setColor(this.colors.exaRed, 'draw');
      this.doc.setLineWidth(0.8);
      this.doc.line(leftX + 5, this.yPosition + 26, leftX + 5 + strikeWidth, this.yPosition + 26);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Período: ${proposal.duration_months} meses`, leftX + 5, this.yPosition + 40);
      
      // Box direito - PRESENTE
      const rightX = this.margin + innerPadding * 2 + boxWidth;
      this.setColor(this.colors.exaRed, 'fill');
      this.doc.roundedRect(rightX, this.yPosition + innerPadding, boxWidth, 45, 2, 2, 'F');
      
      this.setColor(this.colors.white);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('SEU PRESENTE', rightX + boxWidth / 2, this.yPosition + 16, { align: 'center' });
      
      this.doc.setFontSize(22);
      this.doc.text('R$ 0,00', rightX + boxWidth / 2, this.yPosition + 32, { align: 'center' });
      
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Economia de 100%', rightX + boxWidth / 2, this.yPosition + 42, { align: 'center' });
      
      this.yPosition += 62;
    } else {
      // PROPOSTA NORMAL - Com comparação de preços
      
      // === BOX 1: COMPARAÇÃO DE PREÇOS (Preço normal vs Proposta) ===
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 32, 3, 3, 'F');
      
      // Label "Comprando pelo site (sem proposta):"
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Comprando pelo site (sem proposta comercial):', this.margin + 5, this.yPosition + 9);
      
      // Valor normal riscado
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      const normalValue = this.formatCurrency(normalSitePrice);
      this.doc.text(normalValue, this.margin + 5, this.yPosition + 21);
      
      // Strikethrough no valor normal
      const strikeWidth = this.doc.getTextWidth(normalValue);
      this.setColor(this.colors.exaRed, 'draw');
      this.doc.setLineWidth(0.6);
      this.doc.line(this.margin + 5, this.yPosition + 19, this.margin + 5 + strikeWidth, this.yPosition + 19);
      
      // Badge de economia
      const badgeX = this.pageWidth - this.margin - 55;
      this.setColor(this.colors.success, 'fill');
      this.doc.roundedRect(badgeX, this.yPosition + 10, 50, 14, 2, 2, 'F');
      
      this.setColor(this.colors.white);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`ECONOMIA: ${savingsPercent}%`, badgeX + 25, this.yPosition + 19, { align: 'center' });
      
      this.yPosition += 38;
      
      // === BOX 2: OPÇÕES DE PAGAMENTO ===
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 55, 3, 3, 'F');
      
      const boxWidth = (this.contentWidth - innerPadding * 3) / 2;
      
      // Box esquerdo - Plano Fidelidade
      const leftX = this.margin + innerPadding;
      this.setColor(this.colors.white, 'fill');
      this.doc.roundedRect(leftX, this.yPosition + innerPadding, boxWidth, 45, 2, 2, 'F');
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('PLANO FIDELIDADE', leftX + 5, this.yPosition + 15);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${proposal.duration_months}x de`, leftX + 5, this.yPosition + 24);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.formatCurrency(proposal.fidel_monthly_value), leftX + 5, this.yPosition + 36);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Total: ${this.formatCurrency(totalFidelidade)}`, leftX + 5, this.yPosition + 44);
      
      // Box direito - PIX À VISTA (destaque verde)
      const rightX = this.margin + innerPadding * 2 + boxWidth;
      this.setColor(this.colors.success, 'fill');
      this.doc.roundedRect(rightX, this.yPosition + innerPadding, boxWidth, 45, 2, 2, 'F');
      
      this.setColor(this.colors.white);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`PIX A VISTA (+10% OFF)`, rightX + 5, this.yPosition + 15);
      
      // Valor total PIX em destaque
      this.doc.setFontSize(18);
      this.doc.text(this.formatCurrency(proposal.cash_total_value), rightX + 5, this.yPosition + 32);
      
      // Equivalência mensal
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`(${this.formatCurrency(monthlyEquivalent)}/mes)`, rightX + 5, this.yPosition + 42);
      
      // Economia total
      this.setColor(this.colors.white);
      this.doc.setFontSize(7);
      this.doc.text(`Economia total: ${this.formatCurrency(savingsAmount)}`, rightX + 5, this.yPosition + 49);
      
      this.yPosition += 63;
    }
  }

  private drawVideoLinksSection(): void {
    this.checkPageBreak(28);
    
    this.drawSectionTitle('CONHEÇA A EXA MÍDIA');
    
    // Box com links
    this.setColor(this.colors.lightGray, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 20, 2, 2, 'F');
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text('📹 Vídeo Institucional:', this.margin + 5, this.yPosition + 7);
    this.setColor({ r: 59, g: 130, b: 246 });
    this.doc.text('drive.google.com/file/d/19g-1y4dzi60ydc5yXJKDD6sW6MPpyCaZ', this.margin + 42, this.yPosition + 7);
    
    this.setColor(this.colors.darkGray);
    this.doc.text('📊 Mídia Kit:', this.margin + 5, this.yPosition + 14);
    this.setColor({ r: 59, g: 130, b: 246 });
    this.doc.text('drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz', this.margin + 42, this.yPosition + 14);
    
    this.yPosition += 26;
  }

  private drawGeneralConditions(): void {
    this.checkPageBreak(45);
    
    this.drawSectionTitle('CONDIÇÕES GERAIS');
    
    const conditions = [
      '• Vídeo publicitário de até 15 segundos, formato horizontal (16:9)',
      '• Aprovação do conteúdo em até 48 horas úteis',
      '• Relatório mensal de impressões disponível na plataforma',
      '• Possibilidade de troca de vídeo durante a campanha',
      '• Exibição em rotação com outros anunciantes',
      '• Suporte técnico via WhatsApp em horário comercial'
    ];
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    conditions.forEach((condition, index) => {
      this.doc.text(condition, this.margin + 2, this.yPosition + (index * 6));
    });
    
    this.yPosition += conditions.length * 6 + 8;
  }

  private drawSignatureArea(): void {
    this.checkPageBreak(40);
    
    this.drawSectionTitle('ASSINATURAS');
    
    const colWidth = this.contentWidth / 2 - 10;
    
    // Linha cliente
    this.setColor(this.colors.mediumGray, 'draw');
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.yPosition + 20, this.margin + colWidth, this.yPosition + 20);
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Cliente', this.margin + colWidth / 2, this.yPosition + 26, { align: 'center' });
    
    // Linha EXA
    const rightX = this.margin + colWidth + 20;
    this.doc.line(rightX, this.yPosition + 20, rightX + colWidth, this.yPosition + 20);
    this.doc.text('EXA Mídia LTDA', rightX + colWidth / 2, this.yPosition + 26, { align: 'center' });
    
    this.yPosition += 35;
  }

  private async drawFooter(proposal: ProposalData, sellerPhone: string, isCortesia: boolean = false): Promise<void> {
    const footerY = this.pageHeight - 42;
    
    // Linha separadora
    this.setColor(this.colors.lightGray, 'draw');
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 3, this.pageWidth - this.margin, footerY - 3);
    
    // QR Code
    try {
      const qrCodeDataUrl = await this.generateValidationQRCode(proposal.id);
      this.doc.addImage(qrCodeDataUrl, 'PNG', this.margin, footerY, 22, 22);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
    }
    
    // Texto ao lado do QR
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Escaneie para visualizar', this.margin + 25, footerY + 6);
    this.doc.text('esta proposta online', this.margin + 25, footerY + 11);
    
    // Número da proposta
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(proposal.number, this.margin + 25, footerY + 18);
    
    // Validade
    if (proposal.expires_at) {
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Válida até: ${new Date(proposal.expires_at).toLocaleString('pt-BR')}`, this.margin + 25, footerY + 23);
    }
    
    // Contato EXA - lado direito
    const rightX = this.pageWidth - this.margin;
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Contato Comercial', rightX, footerY + 4, { align: 'right' });
    
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(sellerPhone || '(45) 99141-5856', rightX, footerY + 10, { align: 'right' });
    this.doc.text('comercial@examidia.com.br', rightX, footerY + 15, { align: 'right' });
    this.doc.text('www.examidia.com.br', rightX, footerY + 20, { align: 'right' });
  }

  public async generateProposalPDF(
    proposal: ProposalData, 
    sellerName: string = 'Equipe EXA',
    isCortesia: boolean = false,
    baseTotalValue: number = 0,
    sellerPhone: string = '(45) 99141-5856'
  ): Promise<void> {
    // PÁGINA 1
    // Header elegante (fundo branco)
    await this.drawElegantHeader(proposal, sellerName, isCortesia);
    
    // Identificação da proposta
    this.drawProposalIdentification(proposal, isCortesia);
    
    // Dados do cliente
    this.drawClientInfo(proposal, isCortesia);
    
    // Tabela de prédios
    const buildings = proposal.selected_buildings || [];
    this.drawBuildingsTable(buildings);
    
    // Condições comerciais (com destaque no valor à vista)
    this.drawCommercialConditions(proposal, isCortesia, baseTotalValue);
    
    // PÁGINA 2 (se necessário, adiciona automaticamente)
    // Links de vídeo
    this.drawVideoLinksSection();
    
    // Condições gerais
    this.drawGeneralConditions();
    
    // Área de assinaturas
    this.drawSignatureArea();
    
    // Footer com QR Code e contatos
    await this.drawFooter(proposal, sellerPhone, isCortesia);
    
    // Salvar
    const cleanName = proposal.client_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const prefix = isCortesia ? 'Cortesia' : 'Proposta';
    const fileName = `${prefix}_${proposal.number}_${cleanName}.pdf`;
    this.doc.save(fileName);
  }
}
