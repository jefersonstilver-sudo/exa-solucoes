import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

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
  tipo_produto?: 'horizontal' | 'vertical_premium';
}

interface ProductSpecs {
  duracao: number;
  resolucao: string;
  proporcao: string;
  formato: string;
  maxClientes: number;
  exibicoesMes: number;
  exibicoesDia: number;
}

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
    softBlue: { r: 239, g: 246, b: 255 },
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

  private async fetchProductSpecs(tipo: 'horizontal' | 'vertical_premium'): Promise<ProductSpecs> {
    try {
      const codigo = tipo === 'horizontal' ? 'horizontal' : 'vertical_premium';
      
      const { data: produto, error: produtoError } = await supabase
        .from('produtos_exa')
        .select('*')
        .eq('codigo', codigo)
        .single();
      
      const { data: config, error: configError } = await supabase
        .from('configuracoes_exibicao')
        .select('*')
        .limit(1)
        .single();

      if (produtoError || !produto) {
        // Defaults seguros
        const isVertical = tipo === 'vertical_premium';
        return {
          duracao: isVertical ? 15 : 10,
          resolucao: isVertical ? '1080x1920' : '1440x1080',
          proporcao: isVertical ? '9:16' : '4:3',
          formato: isVertical ? 'Vertical Premium' : 'Horizontal',
          maxClientes: isVertical ? 3 : 15,
          exibicoesMes: 11610,
          exibicoesDia: 387,
        };
      }

      const horasOperacao = config?.horas_operacao_dia ?? 21;
      const diasMes = config?.dias_mes ?? 30;
      const segundosDia = horasOperacao * 3600;
      const tempoCiclo = 195;
      const ciclosPorDia = Math.floor(segundosDia / tempoCiclo);
      const exibicoesPorMes = ciclosPorDia * diasMes;

      return {
        duracao: produto.duracao_video_segundos ?? (tipo === 'vertical_premium' ? 15 : 10),
        resolucao: produto.resolucao ?? (tipo === 'vertical_premium' ? '1080x1920' : '1440x1080'),
        proporcao: (produto as any).proporcao ?? (tipo === 'vertical_premium' ? '9:16' : '4:3'),
        formato: tipo === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal',
        maxClientes: produto.max_clientes_por_painel ?? (tipo === 'vertical_premium' ? 3 : 15),
        exibicoesMes: exibicoesPorMes,
        exibicoesDia: ciclosPorDia,
      };
    } catch (err) {
      console.error('Erro ao buscar specs:', err);
      const isVertical = tipo === 'vertical_premium';
      return {
        duracao: isVertical ? 15 : 10,
        resolucao: isVertical ? '1080x1920' : '1440x1080',
        proporcao: isVertical ? '9:16' : '4:3',
        formato: isVertical ? 'Vertical Premium' : 'Horizontal',
        maxClientes: isVertical ? 3 : 15,
        exibicoesMes: 11610,
        exibicoesDia: 387,
      };
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
    
    // Número - SEM EMOJI
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    const prefix = isCortesia ? 'Cortesia' : 'Proposta';
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

  private drawSectionTitle(title: string): void {
    this.checkPageBreak(12);
    
    // Linha superior
    this.setColor(this.colors.exaRed, 'draw');
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition, this.margin + 3, this.yPosition);
    
    // Título - SEM EMOJI
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 5, this.yPosition + 4);
    
    // Linha após título
    const titleWidth = this.doc.getTextWidth(title);
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

  private getCountryLabel(country?: 'BR' | 'AR' | 'PY' | null): string {
    switch (country) {
      case 'AR': return 'Argentina';
      case 'PY': return 'Paraguai';
      default: return 'Brasil';
    }
  }

  private drawClientInfo(proposal: ProposalData, isCortesia: boolean = false): void {
    this.drawSectionTitle(isCortesia ? 'PRESENTEADO' : 'DADOS DO CLIENTE');
    
    const startY = this.yPosition;
    const colWidth = this.contentWidth / 2;
    
    // Determinar label do documento baseado no país
    const documentLabel = this.getDocumentLabel(proposal.client_country);
    const countryLabel = this.getCountryLabel(proposal.client_country);
    
    // Layout em duas colunas - agora com 3 linhas - SEM EMOJIS
    const leftItems = [
      { label: 'Nome do Contato', value: proposal.client_name },
      { label: 'Nome da Empresa', value: proposal.client_company_name || 'Nao informado' },
      { label: documentLabel, value: proposal.client_cnpj || 'Nao informado' },
    ];
    
    const rightItems = [
      { label: 'Telefone', value: proposal.client_phone || 'Nao informado' },
      { label: 'E-mail', value: proposal.client_email || 'Nao informado' },
      { label: 'Pais', value: countryLabel },
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

  private async drawProductShowcase(specs: ProductSpecs, tipo: 'horizontal' | 'vertical_premium'): Promise<void> {
    this.checkPageBreak(65);
    
    this.drawSectionTitle('PRODUTO ESCOLHIDO');
    
    const isVertical = tipo === 'vertical_premium';
    
    // Container principal com fundo suave
    this.setColor(this.colors.softBlue, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 52, 3, 3, 'F');
    
    // Borda sutil
    this.setColor({ r: 200, g: 220, b: 240 }, 'draw');
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 52, 3, 3);
    
    // Área do mockup (lado esquerdo)
    const mockupWidth = 45;
    const mockupHeight = 42;
    const mockupX = this.margin + 5;
    const mockupY = this.yPosition + 5;
    
    // Fundo do mockup
    this.setColor(this.colors.white, 'fill');
    this.doc.roundedRect(mockupX, mockupY, mockupWidth, mockupHeight, 2, 2, 'F');
    
    // Tentar carregar mockup
    try {
      const mockupUrl = isVertical 
        ? 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/mockup/mockup-vertical.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9tb2NrdXAvbW9ja3VwLXZlcnRpY2FsLnBuZyIsImlhdCI6MTc1MTY2Mjk3MiwiZXhwIjozMTcwODM2MDk3Mn0.rFiKMNhWvvmfOO8FTLbHJ8GmhWAZQQhXfOHc7jPxlJM'
        : 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/mockup/mockup-horizontal.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9tb2NrdXAvbW9ja3VwLWhvcml6b250YWwucG5nIiwiaWF0IjoxNzUxNjYyOTQ5LCJleHAiOjMxNzA4MzYwOTQ5fQ.q5eFN0qyKFHTHTKYdg8VGCy7Y1MFwfqHWEqDKPqhbhU';
      
      const mockupDataUrl = await this.loadImageAsDataURL(mockupUrl);
      
      // Ajustar proporção do mockup
      if (isVertical) {
        // Vertical: mais alto que largo
        const imgWidth = 25;
        const imgHeight = 38;
        const imgX = mockupX + (mockupWidth - imgWidth) / 2;
        const imgY = mockupY + 2;
        this.doc.addImage(mockupDataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
      } else {
        // Horizontal: mais largo que alto
        const imgWidth = 40;
        const imgHeight = 30;
        const imgX = mockupX + (mockupWidth - imgWidth) / 2;
        const imgY = mockupY + (mockupHeight - imgHeight) / 2;
        this.doc.addImage(mockupDataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
      }
    } catch {
      // Fallback: texto do produto
      this.setColor(this.colors.exaRed);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(isVertical ? 'VERTICAL' : 'HORIZONTAL', mockupX + mockupWidth / 2, mockupY + mockupHeight / 2, { align: 'center' });
    }
    
    // Área de especificações (lado direito)
    const specsX = this.margin + mockupWidth + 15;
    const specsY = this.yPosition + 5;
    
    // Título do produto
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(isVertical ? 'VERTICAL PREMIUM' : 'HORIZONTAL', specsX, specsY + 6);
    
    // Badge com destaque
    const badgeText = isVertical ? 'Full Screen' : 'Standard';
    this.setColor(this.colors.exaRed, 'fill');
    const badgeWidth = this.doc.getTextWidth(badgeText) + 6;
    this.doc.roundedRect(specsX + (isVertical ? 70 : 55), specsY + 1, badgeWidth, 8, 2, 2, 'F');
    this.setColor(this.colors.white);
    this.doc.setFontSize(7);
    this.doc.text(badgeText, specsX + (isVertical ? 73 : 58), specsY + 6);
    
    // Especificações em grid 2x3
    const specItems = [
      { label: 'Duracao', value: `${specs.duracao} segundos` },
      { label: 'Resolucao', value: specs.resolucao },
      { label: 'Exibicoes/mes', value: specs.exibicoesMes.toLocaleString('pt-BR') },
      { label: 'Empresas/predio', value: `Ate ${specs.maxClientes}` },
      { label: 'Proporcao', value: specs.proporcao },
      { label: 'Vezes/dia', value: specs.exibicoesDia.toLocaleString('pt-BR') },
    ];
    
    const specColWidth = 55;
    specItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = specsX + (col * specColWidth);
      const y = specsY + 14 + (row * 11);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.label, x, y);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.value, x, y + 5);
    });
    
    this.yPosition += 58;
  }

  private drawBuildingsTable(buildings: any[]): void {
    const totalPanels = buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0);
    const totalImpressions = buildings.reduce((sum: number, b: any) => sum + (b.visualizacoes_mes || 0), 0);
    
    this.drawSectionTitle(`LOCAIS INCLUIDOS (${buildings.length} predios - ${totalPanels} telas)`);
    
    // Header da tabela
    this.setColor(this.colors.tableHeader, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 8, 1, 1, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    
    const cols = [
      { label: 'PREDIO', x: this.margin + 3, w: 58 },
      { label: 'BAIRRO', x: this.margin + 63, w: 35 },
      { label: 'ENDERECO', x: this.margin + 100, w: 45 },
      { label: 'TELAS', x: this.margin + 147, w: 15 },
      { label: 'IMP/MES', x: this.margin + 163, w: 18 }
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
    
    this.drawSectionTitle('CONDICOES COMERCIAIS');
    
    const totalFidelidade = proposal.fidel_monthly_value * proposal.duration_months;
    const monthlyEquivalent = proposal.cash_total_value / proposal.duration_months;
    
    // Calcular o preço normal do site (sem desconto de proposta)
    const normalSitePrice = baseTotalValue > 0 ? baseTotalValue : totalFidelidade * 1.25;
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
      this.doc.text(`Periodo: ${proposal.duration_months} meses`, leftX + 5, this.yPosition + 40);
      
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
      
      // === BOX 1: COMPARAÇÃO DE PREÇOS ===
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 32, 3, 3, 'F');
      
      // Label
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
      
      // Strikethrough
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
      this.doc.text('PIX A VISTA (+10% OFF)', rightX + 5, this.yPosition + 15);
      
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
    
    this.drawSectionTitle('CONHECA A EXA MIDIA');
    
    // Box com links - SEM EMOJIS
    this.setColor(this.colors.lightGray, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 20, 2, 2, 'F');
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text('Video Institucional:', this.margin + 5, this.yPosition + 7);
    this.setColor({ r: 59, g: 130, b: 246 });
    this.doc.text('drive.google.com/file/d/19g-1y4dzi60ydc5yXJKDD6sW6MPpyCaZ', this.margin + 42, this.yPosition + 7);
    
    this.setColor(this.colors.darkGray);
    this.doc.text('Midia Kit:', this.margin + 5, this.yPosition + 14);
    this.setColor({ r: 59, g: 130, b: 246 });
    this.doc.text('drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz', this.margin + 42, this.yPosition + 14);
    
    this.yPosition += 26;
  }

  private drawGeneralConditions(specs: ProductSpecs): void {
    this.checkPageBreak(45);
    
    this.drawSectionTitle('CONDICOES GERAIS');
    
    // Condições DINÂMICAS baseadas no tipo de produto
    const conditions = [
      `- Video publicitario de ate ${specs.duracao} segundos, formato ${specs.formato} ${specs.proporcao} (${specs.resolucao})`,
      '- Aprovacao do conteudo em ate 48 horas uteis',
      '- Relatorio mensal de impressoes disponivel na plataforma',
      '- Possibilidade de troca de video durante a campanha',
      '- Exibicao em rotacao com outros anunciantes (~195s por ciclo)',
      '- Suporte tecnico via WhatsApp em horario comercial'
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
    this.doc.text('EXA Midia LTDA', rightX + colWidth / 2, this.yPosition + 26, { align: 'center' });
    
    this.yPosition += 35;
  }

  private async drawFooter(proposal: ProposalData, sellerName: string, sellerPhone: string, isCortesia: boolean = false): Promise<void> {
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
      this.doc.text(`Valida ate: ${new Date(proposal.expires_at).toLocaleString('pt-BR')}`, this.margin + 25, footerY + 23);
    }
    
    // Contato do Vendedor - lado direito
    const rightX = this.pageWidth - this.margin;
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Contato Comercial', rightX, footerY + 4, { align: 'right' });
    
    // Nome do vendedor em negrito
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(sellerName || 'Equipe EXA', rightX, footerY + 10, { align: 'right' });
    
    // Telefone do vendedor
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(sellerPhone || '(45) 99141-5856', rightX, footerY + 16, { align: 'right' });
    this.doc.text('www.examidia.com.br', rightX, footerY + 21, { align: 'right' });
  }

  public async generateProposalPDF(
    proposal: ProposalData, 
    sellerName: string = 'Equipe EXA',
    isCortesia: boolean = false,
    baseTotalValue: number = 0,
    sellerPhone: string = '(45) 99141-5856'
  ): Promise<void> {
    // Determinar tipo de produto
    const tipoProduto = proposal.tipo_produto || 'horizontal';
    
    // Buscar especificações dinâmicas do banco
    const specs = await this.fetchProductSpecs(tipoProduto);
    
    // PÁGINA 1
    // Header elegante (fundo branco)
    await this.drawElegantHeader(proposal, sellerName, isCortesia);
    
    // Identificação da proposta
    this.drawProposalIdentification(proposal, isCortesia);
    
    // Dados do cliente
    this.drawClientInfo(proposal, isCortesia);
    
    // MÓDULO DE PRODUTO - NOVO
    await this.drawProductShowcase(specs, tipoProduto);
    
    // Tabela de prédios
    const buildings = proposal.selected_buildings || [];
    this.drawBuildingsTable(buildings);
    
    // Condições comerciais (com destaque no valor à vista)
    this.drawCommercialConditions(proposal, isCortesia, baseTotalValue);
    
    // PÁGINA 2 (se necessário, adiciona automaticamente)
    // Links de vídeo
    this.drawVideoLinksSection();
    
    // Condições gerais - DINÂMICAS
    this.drawGeneralConditions(specs);
    
    // Área de assinaturas
    this.drawSignatureArea();
    
    // Footer com QR Code e contatos
    await this.drawFooter(proposal, sellerName, sellerPhone, isCortesia);
    
    // Salvar
    const cleanName = proposal.client_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const prefix = isCortesia ? 'Cortesia' : 'Proposta';
    const productSuffix = tipoProduto === 'vertical_premium' ? '_Vertical_Premium' : '';
    const fileName = `${prefix}_EXA${productSuffix}_${proposal.number}_${cleanName}.pdf`;
    this.doc.save(fileName);
  }
}
