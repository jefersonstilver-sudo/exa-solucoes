import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface ProposalData {
  id: string;
  number: string;
  client_name: string;
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

export class ProposalPDFExporter {
  private doc: jsPDF;
  private yPosition: number = 0;
  private readonly pageWidth = 210;
  private readonly pageHeight = 297;
  private readonly margin = 15;
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
    const validationUrl = `https://examidia.com.br/propostacomercial/${proposalId}`;
    return await QRCode.toDataURL(validationUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#9C1E1E', light: '#FFFFFF' }
    });
  }

  private checkPageBreak(height: number): void {
    if (this.yPosition + height > this.pageHeight - this.margin - 50) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  private async drawHeader(proposal: ProposalData): Promise<void> {
    // Header vermelho EXA
    this.doc.setFillColor(156, 30, 30);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    // Logo EXA
    try {
      const logoUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';
      const dataUrl = await this.loadImageAsDataURL(logoUrl);
      this.doc.addImage(dataUrl, 'PNG', this.margin, 8, 24, 24);
    } catch {
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('EXA', this.margin, 22);
    }
    
    // Título
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROPOSTA COMERCIAL', this.pageWidth / 2, 18, { align: 'center' });
    
    // Subtítulo
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Publicidade Inteligente em Painéis Digitais', this.pageWidth / 2, 26, { align: 'center' });
    
    // Data
    this.doc.setFontSize(7);
    const dateText = `Emitido: ${this.formatDate(proposal.created_at)}`;
    this.doc.text(dateText, this.pageWidth - this.margin - this.doc.getTextWidth(dateText), 34);
    
    this.yPosition = 48;
  }

  private drawProposalNumber(proposal: ProposalData): void {
    // Box com número e status
    this.doc.setFillColor(254, 242, 242);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 16, 'F');
    
    this.doc.setDrawColor(156, 30, 30);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 16);
    
    // Número
    this.doc.setTextColor(156, 30, 30);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Proposta ${proposal.number}`, this.margin + 4, this.yPosition + 10);
    
    // Status badge
    const statusConfig: Record<string, { bg: number[]; text: string }> = {
      'enviada': { bg: [59, 130, 246], text: 'ENVIADA' },
      'visualizada': { bg: [147, 51, 234], text: 'VISUALIZADA' },
      'aceita': { bg: [34, 197, 94], text: 'ACEITA' },
      'recusada': { bg: [239, 68, 68], text: 'RECUSADA' },
      'expirada': { bg: [107, 114, 128], text: 'EXPIRADA' },
    };
    
    const config = statusConfig[proposal.status] || { bg: [107, 114, 128], text: proposal.status.toUpperCase() };
    const badgeX = this.pageWidth - this.margin - 35;
    
    this.doc.setFillColor(config.bg[0], config.bg[1], config.bg[2]);
    this.doc.roundedRect(badgeX, this.yPosition + 4, 30, 8, 2, 2, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    const textWidth = this.doc.getTextWidth(config.text);
    this.doc.text(config.text, badgeX + 15 - textWidth / 2, this.yPosition + 9.5);
    
    this.yPosition += 22;
  }

  private drawSection(title: string): void {
    this.checkPageBreak(14);
    
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 10, 'F');
    
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 3, this.yPosition + 7);
    
    this.yPosition += 14;
  }

  private drawInfoRow(label: string, value: string, highlight: boolean = false): void {
    this.checkPageBreak(7);
    
    if (highlight) {
      this.doc.setFillColor(254, 242, 242);
      this.doc.rect(this.margin, this.yPosition - 1, this.contentWidth, 7, 'F');
    }
    
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(label + ':', this.margin + 3, this.yPosition + 4);
    
    this.doc.setTextColor(31, 41, 55);
    this.doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    this.doc.text(value, this.margin + 45, this.yPosition + 4);
    
    this.yPosition += 7;
  }

  private drawBuildingsTable(buildings: any[]): void {
    this.checkPageBreak(10 + buildings.length * 7);
    
    // Header da tabela
    this.doc.setFillColor(75, 85, 99);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 7, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    
    const cols = [
      { label: 'Prédio', x: this.margin + 2, w: 60 },
      { label: 'Bairro', x: this.margin + 65, w: 40 },
      { label: 'Telas', x: this.margin + 108, w: 20 },
      { label: 'Imp./Mês', x: this.margin + 130, w: 30 },
      { label: 'Valor/Tela', x: this.margin + 155, w: 25 }
    ];
    
    cols.forEach(col => {
      this.doc.text(col.label, col.x, this.yPosition + 5);
    });
    
    this.yPosition += 9;
    
    // Linhas
    buildings.forEach((b, index) => {
      if (index % 2 === 0) {
        this.doc.setFillColor(249, 250, 251);
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, 6, 'F');
      }
      
      this.doc.setTextColor(31, 41, 55);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      
      const nome = (b.building_name || b.nome || '').substring(0, 28);
      const bairro = (b.bairro || '').substring(0, 18);
      const telas = String(b.quantidade_telas || 1);
      const imp = (b.visualizacoes_mes || 0).toLocaleString();
      const valor = this.formatCurrency(b.preco_base || 0);
      
      this.doc.text(nome, cols[0].x, this.yPosition + 4);
      this.doc.text(bairro, cols[1].x, this.yPosition + 4);
      this.doc.text(telas, cols[2].x, this.yPosition + 4);
      this.doc.text(imp, cols[3].x, this.yPosition + 4);
      this.doc.text(valor, cols[4].x, this.yPosition + 4);
      
      this.yPosition += 6;
    });
    
    this.yPosition += 5;
  }

  private drawFinancialSummary(proposal: ProposalData): void {
    this.checkPageBreak(35);
    
    // Box financeiro
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 32, 'F');
    
    this.doc.setDrawColor(156, 30, 30);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 32);
    
    // Título
    this.doc.setTextColor(156, 30, 30);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CONDIÇÕES COMERCIAIS', this.margin + 4, this.yPosition + 7);
    
    const leftCol = this.margin + 4;
    const rightCol = this.pageWidth / 2 + 10;
    
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    // Coluna esquerda
    this.doc.text(`Período: ${proposal.duration_months} meses`, leftCol, this.yPosition + 14);
    this.doc.text(`Valor Mensal: ${this.formatCurrency(proposal.fidel_monthly_value)}`, leftCol, this.yPosition + 20);
    this.doc.text(`Total Fidelidade: ${this.formatCurrency(proposal.fidel_monthly_value * proposal.duration_months)}`, leftCol, this.yPosition + 26);
    
    // Coluna direita - Destaque
    this.doc.setFillColor(254, 242, 242);
    this.doc.rect(rightCol - 4, this.yPosition + 10, 80, 18, 'F');
    
    this.doc.setTextColor(156, 30, 30);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`💰 VALOR À VISTA (${proposal.discount_percent}% OFF)`, rightCol, this.yPosition + 18);
    
    this.doc.setFontSize(14);
    this.doc.text(this.formatCurrency(proposal.cash_total_value), rightCol, this.yPosition + 26);
    
    this.yPosition += 38;
  }

  private async drawValidationFooter(proposal: ProposalData): Promise<void> {
    const footerY = this.pageHeight - 45;
    
    // Linha separadora
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // QR Code
    try {
      const qrCodeDataUrl = await this.generateValidationQRCode(proposal.id);
      this.doc.addImage(qrCodeDataUrl, 'PNG', this.margin, footerY, 25, 25);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
    }
    
    // Texto ao lado do QR
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Escaneie o QR Code para', this.margin + 28, footerY + 8);
    this.doc.text('validar esta proposta online', this.margin + 28, footerY + 13);
    
    // Número da proposta
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(156, 30, 30);
    this.doc.text(proposal.number, this.margin + 28, footerY + 21);
    
    // Validade
    if (proposal.expires_at) {
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(107, 114, 128);
      this.doc.text(`Válida até: ${new Date(proposal.expires_at).toLocaleString('pt-BR')}`, this.margin + 28, footerY + 26);
    }
    
    // Contato EXA - lado direito
    this.doc.setFontSize(7);
    this.doc.setTextColor(107, 114, 128);
    const rightX = this.pageWidth - this.margin - 45;
    this.doc.text('www.examidia.com.br', rightX, footerY + 10);
    this.doc.text('comercial@examidia.com.br', rightX, footerY + 15);
    this.doc.text('(45) 99141-5856', rightX, footerY + 20);
  }

  public async generateProposalPDF(proposal: ProposalData, sellerName: string = 'Equipe EXA'): Promise<void> {
    // Header
    await this.drawHeader(proposal);
    
    // Número e status
    this.drawProposalNumber(proposal);
    
    // Dados do cliente
    this.drawSection('DADOS DO CLIENTE');
    this.drawInfoRow('Nome', proposal.client_name, true);
    if (proposal.client_cnpj) {
      this.drawInfoRow('CNPJ', proposal.client_cnpj);
    }
    if (proposal.client_phone) {
      this.drawInfoRow('Telefone', proposal.client_phone);
    }
    if (proposal.client_email) {
      this.drawInfoRow('E-mail', proposal.client_email);
    }
    
    this.yPosition += 5;
    
    // Prédios
    const buildings = proposal.selected_buildings || [];
    this.drawSection(`PRÉDIOS INCLUÍDOS (${buildings.length} prédios • ${proposal.total_panels} telas)`);
    this.drawBuildingsTable(buildings);
    
    // Resumo financeiro
    this.drawFinancialSummary(proposal);
    
    // Footer com QR Code
    await this.drawValidationFooter(proposal);
    
    // Salvar
    const cleanName = proposal.client_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileName = `Proposta_${proposal.number}_${cleanName}.pdf`;
    this.doc.save(fileName);
  }
}
