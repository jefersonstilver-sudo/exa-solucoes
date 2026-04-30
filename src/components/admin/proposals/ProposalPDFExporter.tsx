import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

// Mockups (mesmos usados na página pública)
import mockupHorizontal from '@/assets/mockup-horizontal-new.png';
import mockupVertical from '@/assets/mockups/mockup-vertical.png';

interface ProposalData {
  id: string;
  number: string;
  client_name: string;
  client_company_name?: string | null;
  client_country?: 'BR' | 'AR' | 'PY' | null;
  client_cnpj: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_logo_url?: string | null;
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
  // Campos para período em dias
  is_custom_days?: boolean | null;
  custom_days?: number | null;
  // Campos de Permuta
  modalidade_proposta?: 'monetaria' | 'permuta' | null;
  itens_permuta?: Array<{
    id: string;
    nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
    ocultar_preco?: boolean;
  }> | null;
  valor_total_permuta?: number | null;
  ocultar_valores_publico?: boolean | null;
  descricao_contrapartida?: string | null;
  valor_referencia_monetaria?: number | null;
  // Campos de posições/marcas
  quantidade_posicoes?: number | null;
  // Venda futura
  is_venda_futura?: boolean | null;
  predios_contratados?: number | null;
  max_videos_por_pedido?: number | null;
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

  // Normaliza texto removendo acentos (jsPDF não suporta Unicode nativamente)
  private normalizeText(text: string): string {
    const accentsMap: Record<string, string> = {
      'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c', 'ñ': 'n',
      'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
      'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
      'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
      'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
      'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
      'Ç': 'C', 'Ñ': 'N'
    };
    return text.split('').map(char => accentsMap[char] || char).join('');
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

  // Método otimizado para mockups: redimensiona e comprime para PDF leve
  private async loadMockupOptimized(url: string, maxWidth: number = 200, maxHeight: number = 300): Promise<{ dataUrl: string; aspectRatio: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        
        let targetWidth = maxWidth;
        let targetHeight = maxWidth / aspectRatio;
        
        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          targetWidth = maxHeight * aspectRatio;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve({ dataUrl, aspectRatio });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Carregar logo em preto para impressão
  private async loadImageAsDataURLBlack(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 0) {
              data[i] = 0;
              data[i + 1] = 0;
              data[i + 2] = 0;
            }
          }
          ctx?.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Gerar signed URL para logos privadas
  private async getSignedLogoUrl(logoUrl: string): Promise<string> {
    try {
      const storagePattern = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
      const match = logoUrl.match(storagePattern);
      
      if (match) {
        const bucketName = match[1];
        const filePath = match[2].split('?')[0];
        
        const { data: signedData, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600);
        
        if (signedData?.signedUrl && !error) {
          return signedData.signedUrl;
        }
      }
      
      return logoUrl;
    } catch {
      return logoUrl;
    }
  }

  private async generateValidationQRCode(proposalId: string): Promise<string> {
    const validationUrl = `https://www.examidia.com.br/propostacomercial/${proposalId}`;
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
      
      const { data: config } = await supabase
        .from('configuracoes_exibicao')
        .select('*')
        .limit(1)
        .single();

      if (produtoError || !produto) {
        const isVertical = tipo === 'vertical_premium';
        return {
          duracao: isVertical ? 15 : 10,
          resolucao: isVertical ? '1080x1920' : '1440x1080',
          proporcao: isVertical ? '9:16' : '4:3',
          formato: isVertical ? 'Vertical Premium' : 'Horizontal',
          maxClientes: isVertical ? 3 : 15,
          exibicoesMes: isVertical ? 5010 : 15060,
          exibicoesDia: isVertical ? 167 : 502,
        };
      }

      const horasOperacao = config?.horas_operacao_dia ?? 23;
      const diasMes = config?.dias_mes ?? 30;
      const segundosDia = horasOperacao * 3600;
      // Ciclo oficial 2026: 15 horizontais (10s) + 1 vertical (15s) = 165s
      const tempoCiclo = 165;
      const ciclosPorDia = Math.floor(segundosDia / tempoCiclo); // ~502
      const isVerticalProd = tipo === 'vertical_premium';
      // Vertical é dividido entre 3 marcas → ciclos/3
      const exibicoesDia = isVerticalProd ? Math.floor(ciclosPorDia / 3) : ciclosPorDia;
      const exibicoesPorMes = exibicoesDia * diasMes;

      return {
        duracao: produto.duracao_video_segundos ?? (isVerticalProd ? 15 : 10),
        resolucao: produto.resolucao ?? (isVerticalProd ? '1080x1920' : '1440x1080'),
        proporcao: (produto as any).proporcao ?? (isVerticalProd ? '9:16' : '4:3'),
        formato: isVerticalProd ? 'Vertical Premium' : 'Horizontal',
        maxClientes: produto.max_clientes_por_painel ?? (isVerticalProd ? 3 : 15),
        exibicoesMes: exibicoesPorMes,
        exibicoesDia: exibicoesDia,
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
        exibicoesMes: isVertical ? 5010 : 15060,
        exibicoesDia: isVertical ? 167 : 502,
      };
    }
  }

  private async drawElegantHeader(proposal: ProposalData, sellerName: string, isCortesia: boolean = false): Promise<void> {
    // Fundo branco limpo
    this.setColor(this.colors.white, 'fill');
    this.doc.rect(0, 0, this.pageWidth, 42, 'F');
    
    // Logo EXA (esquerda) em PRETO para impressao
    try {
      const logoUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';
      const dataUrl = await this.loadImageAsDataURLBlack(logoUrl);
      this.doc.addImage(dataUrl, 'PNG', this.margin, 8, 28, 18);
    } catch {
      // Fallback: texto EXA em preto
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(20);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('EXA', this.margin + 5, 22);
    }
    
    // Logo do Cliente (direita) em PRETO para impressao
    if (proposal.client_logo_url) {
      try {
        const signedUrl = await this.getSignedLogoUrl(proposal.client_logo_url);
        const clientLogoData = await this.loadImageAsDataURLBlack(signedUrl);
        this.doc.addImage(clientLogoData, 'PNG', this.pageWidth - this.margin - 26, 8, 22, 18);
      } catch (err) {
        console.error('Erro ao carregar logo do cliente:', err);
      }
    }
    
    // Titulo central
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    
    const title = isCortesia ? 'PRESENTE CORTESIA' : 'PROPOSTA COMERCIAL';
    this.doc.text(title, this.pageWidth / 2, 14, { align: 'center' });
    
    // Subtitulo
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Publicidade Inteligente em Elevadores', this.pageWidth / 2, 21, { align: 'center' });
    
    // Data e vendedor abaixo do subtitulo (centralizados)
    this.doc.setFontSize(7);
    this.setColor(this.colors.mediumGray);
    this.doc.text(`Emitido: ${this.formatDate(proposal.created_at)}`, this.pageWidth / 2 - 30, 28);
    
    this.setColor(this.colors.exaRed);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Vendedor: ${sellerName}`, this.pageWidth / 2 + 20, 28);
    
    // Linha separadora elegante (vermelho EXA fino)
    this.setColor(this.colors.exaRed, 'draw');
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, 36, this.pageWidth - this.margin, 36);
    
    this.yPosition = 42;
  }

  private drawProposalIdentification(proposal: ProposalData, isCortesia: boolean = false): void {
    // Box com numero da proposta
    this.setColor(this.colors.lightGray, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 12, 2, 2, 'F');
    
    // Borda sutil
    this.setColor(this.colors.mediumGray, 'draw');
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 12, 2, 2);
    
    // Numero
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    const prefix = isCortesia ? 'Cortesia' : 'Proposta';
    this.doc.text(`${prefix} ${proposal.number}`, this.margin + 5, this.yPosition + 8);
    
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
    const badgeX = this.pageWidth - this.margin - 30;
    
    this.setColor(config.bg, 'fill');
    this.doc.roundedRect(badgeX, this.yPosition + 2, 26, 8, 2, 2, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'bold');
    const textWidth = this.doc.getTextWidth(config.text);
    this.doc.text(config.text, badgeX + 13 - textWidth / 2, this.yPosition + 7.5);
    
    this.yPosition += 17;
  }

  private drawSectionTitle(title: string): void {
    this.checkPageBreak(12);
    
    // Linha superior
    this.setColor(this.colors.exaRed, 'draw');
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition, this.margin + 3, this.yPosition);
    
    // Titulo normalizado
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    const normalizedTitle = this.normalizeText(title);
    this.doc.text(normalizedTitle, this.margin + 5, this.yPosition + 4);
    
    // Linha apos titulo
    const titleWidth = this.doc.getTextWidth(normalizedTitle);
    this.doc.line(this.margin + 8 + titleWidth, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    
    this.yPosition += 9;
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
    
    const documentLabel = this.getDocumentLabel(proposal.client_country);
    const countryLabel = this.getCountryLabel(proposal.client_country);
    
    // Layout em duas colunas - textos normalizados
    const leftItems = [
      { label: 'Nome do Contato', value: proposal.client_name },
      { label: 'Nome da Empresa', value: proposal.client_company_name || this.normalizeText('Nao informado') },
      { label: documentLabel, value: proposal.client_cnpj || this.normalizeText('Nao informado') },
    ];
    
    const rightItems = [
      { label: 'Telefone', value: proposal.client_phone || this.normalizeText('Nao informado') },
      { label: 'E-mail', value: proposal.client_email || this.normalizeText('Nao informado') },
      { label: this.normalizeText('Pais'), value: countryLabel },
    ];
    
    // Coluna esquerda
    leftItems.forEach((item, index) => {
      const y = startY + (index * 9);
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.normalizeText(item.label), this.margin, y + 3);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.normalizeText(item.value), this.margin, y + 8);
    });
    
    // Coluna direita
    rightItems.forEach((item, index) => {
      const y = startY + (index * 9);
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.normalizeText(item.label), this.margin + colWidth, y + 3);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      const value = item.value.length > 35 ? item.value.substring(0, 35) + '...' : item.value;
      this.doc.text(this.normalizeText(value), this.margin + colWidth, y + 8);
    });
    
    this.yPosition = startY + 32;
  }

  private async drawProductShowcase(specs: ProductSpecs, tipo: 'horizontal' | 'vertical_premium', totalPanels: number = 1, quantidadePosicoes: number = 1): Promise<void> {
    const hasMultiplePosicoes = quantidadePosicoes > 1;
    const boxHeightBase = hasMultiplePosicoes ? 52 : 42;
    this.checkPageBreak(boxHeightBase + 10);
    
    this.drawSectionTitle('PRODUTO ESCOLHIDO');
    
    const isVertical = tipo === 'vertical_premium';
    
    // Container principal com fundo suave
    this.setColor(this.colors.softBlue, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, boxHeightBase, 3, 3, 'F');
    
    // Borda sutil
    this.setColor({ r: 200, g: 220, b: 240 }, 'draw');
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, boxHeightBase, 3, 3);
    
    // Area do mockup (lado esquerdo) - reduzido
    const mockupWidth = 38;
    const mockupHeight = 34;
    const mockupX = this.margin + 4;
    const mockupY = this.yPosition + 4;
    
    // Fundo do mockup
    this.setColor(this.colors.lightGray, 'fill');
    this.doc.roundedRect(mockupX, mockupY, mockupWidth, mockupHeight, 2, 2, 'F');
    
    // Tentar carregar mockup otimizado
    try {
      const mockupUrl = isVertical ? mockupVertical : mockupHorizontal;
      const { dataUrl, aspectRatio } = await this.loadMockupOptimized(mockupUrl, 200, 300);
      
      let imgWidth: number;
      let imgHeight: number;
      
      if (aspectRatio > 1) {
        imgWidth = mockupWidth - 4;
        imgHeight = imgWidth / aspectRatio;
        if (imgHeight > mockupHeight - 4) {
          imgHeight = mockupHeight - 4;
          imgWidth = imgHeight * aspectRatio;
        }
      } else {
        imgHeight = mockupHeight - 4;
        imgWidth = imgHeight * aspectRatio;
        if (imgWidth > mockupWidth - 4) {
          imgWidth = mockupWidth - 4;
          imgHeight = imgWidth / aspectRatio;
        }
      }
      
      const imgX = mockupX + (mockupWidth - imgWidth) / 2;
      const imgY = mockupY + (mockupHeight - imgHeight) / 2;
      
      this.doc.addImage(dataUrl, 'JPEG', imgX, imgY, imgWidth, imgHeight);
    } catch {
      this.setColor(this.colors.exaRed);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(isVertical ? 'VERTICAL' : 'HORIZONTAL', mockupX + mockupWidth / 2, mockupY + mockupHeight / 2, { align: 'center' });
    }
    
    // Area de especificacoes (lado direito)
    const specsX = this.margin + mockupWidth + 12;
    const specsY = this.yPosition + 4;
    
    // Titulo do produto
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(isVertical ? 'VERTICAL PREMIUM' : 'HORIZONTAL', specsX, specsY + 5);
    
    // Badge com destaque
    const badgeText = isVertical ? 'Full Screen' : 'Standard';
    this.setColor(this.colors.exaRed, 'fill');
    const badgeWidth = this.doc.getTextWidth(badgeText) + 5;
    this.doc.roundedRect(specsX + (isVertical ? 65 : 50), specsY + 1, badgeWidth, 6, 1, 1, 'F');
    this.setColor(this.colors.white);
    this.doc.setFontSize(6);
    this.doc.text(badgeText, specsX + (isVertical ? 67 : 52), specsY + 5);
    
    // Especificacoes em grid 2x3 - textos normalizados
    const specItems = [
      { label: 'Duracao', value: `${specs.duracao} segundos` },
      { label: 'Resolucao', value: specs.resolucao },
      { label: 'Exibicoes/mes', value: specs.exibicoesMes.toLocaleString('pt-BR') },
      { label: 'Empresas/predio', value: `Ate ${specs.maxClientes}` },
      { label: 'Proporcao', value: specs.proporcao },
      { label: 'Vezes/dia (total)', value: (specs.exibicoesDia * totalPanels).toLocaleString('pt-BR') },
    ];
    
    const specColWidth = 52;
    specItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = specsX + (col * specColWidth);
      const y = specsY + 11 + (row * 9);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.normalizeText(item.label), x, y);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.normalizeText(item.value), x, y + 4);
    });
    
    // Info de multiplas posicoes/marcas
    if (hasMultiplePosicoes) {
      const posY = this.yPosition + 42;
      this.setColor(this.colors.exaRed, 'fill');
      this.doc.roundedRect(this.margin + 4, posY, this.contentWidth - 8, 7, 1, 1, 'F');
      
      this.setColor(this.colors.white);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(
        this.normalizeText(`${quantidadePosicoes}x Posicoes por Painel  |  ${quantidadePosicoes} Marcas Simultaneas`),
        this.pageWidth / 2, posY + 5, { align: 'center' }
      );
    }
    
    this.yPosition += boxHeightBase + 5;
  }

  // NOVO: Resumo Executivo (replica ProposalSummaryText.tsx)
  private drawSummaryText(proposal: ProposalData, specs: ProductSpecs): void {
    const tipoProduto = proposal.tipo_produto || 'horizontal';
    const quantidadePosicoes = proposal.quantidade_posicoes || 1;
    const totalPredios = proposal.selected_buildings?.length || 0;
    const totalTelas = proposal.total_panels || 0;
    const exibicoesMes = proposal.total_impressions_month || specs.exibicoesMes;
    const duracaoMeses = proposal.duration_months;
    const isHorizontal = tipoProduto === 'horizontal';
    const formatoNome = isHorizontal ? 'Horizontal' : 'Vertical Premium';
    const hasMultiplePosicoes = quantidadePosicoes > 1;
    const maxVideosPorPedido = proposal.max_videos_por_pedido || 10;
    const isVendaFutura = proposal.is_venda_futura || false;
    const prediosContratados = proposal.predios_contratados || 0;
    const prediosExibidos = isVendaFutura && prediosContratados ? prediosContratados : totalPredios;
    const totalVideosSimultaneos = isHorizontal ? maxVideosPorPedido * quantidadePosicoes : quantidadePosicoes;

    this.checkPageBreak(50);

    this.drawSectionTitle('RESUMO DA PROPOSTA');

    const maxW = this.contentWidth - 10;
    const startY = this.yPosition;

    // Paragrafo principal
    const p1 = this.normalizeText(
      `Esta proposta oferece ${quantidadePosicoes} ${quantidadePosicoes === 1 ? 'posicao' : 'posicoes'} no formato ${formatoNome}, com presenca em ${prediosExibidos} predios e ${totalTelas} telas. Seu anuncio de ${specs.duracao}s sera exibido aproximadamente ${exibicoesMes.toLocaleString('pt-BR')}x/mes — uma exposicao diaria que forma opiniao e gera lembranca de marca.`
    );
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    const lines1 = this.doc.splitTextToSize(p1, maxW);
    this.doc.text(lines1, this.margin + 5, this.yPosition);
    this.yPosition += lines1.length * 3.5 + 2;

    // Diferenciais
    const p2 = this.normalizeText(
      'A midia em elevador e altamente eficaz: publico recorrente (residentes e visitantes diarios), atencao inevitavel (ambiente fechado) e repeticao que consolida sua marca na mente do consumidor.'
    );
    this.setColor(this.colors.mediumGray);
    this.doc.setFont('helvetica', 'italic');
    const lines2 = this.doc.splitTextToSize(p2, maxW);
    this.doc.text(lines2, this.margin + 5, this.yPosition);
    this.yPosition += lines2.length * 3.5 + 2;

    // Condicionais
    this.setColor(this.colors.darkGray);
    this.doc.setFont('helvetica', 'normal');

    if (isHorizontal && !hasMultiplePosicoes) {
      const t = this.normalizeText(`-> Com o formato Horizontal, sua marca pode agendar ate ${maxVideosPorPedido} videos diferentes no mesmo pedido, funcionando como uma nova revista digital. E possivel exibir uma campanha na segunda, outra na terca, uma terceira na quarta e criar promocoes especificas para sabado e domingo.`);
      const l = this.doc.splitTextToSize(t, maxW);
      this.doc.text(l, this.margin + 5, this.yPosition);
      this.yPosition += l.length * 3.5 + 1;
    }

    if (isHorizontal && hasMultiplePosicoes) {
      const t = this.normalizeText(`-> Com o formato Horizontal e ${quantidadePosicoes} marcas, sua empresa pode manter ${totalVideosSimultaneos} videos simultaneos na plataforma (${maxVideosPorPedido} videos x ${quantidadePosicoes} posicoes), distribuindo campanhas por dia, horario, QR Code, lancamento ou promocao especifica.`);
      const l = this.doc.splitTextToSize(t, maxW);
      this.doc.text(l, this.margin + 5, this.yPosition);
      this.yPosition += l.length * 3.5 + 1;
    }

    if (!isHorizontal) {
      const t = this.normalizeText('-> O formato Vertical Premium garante atencao exclusiva: tela cheia, sem divisao com outros anunciantes.');
      const l = this.doc.splitTextToSize(t, maxW);
      this.doc.text(l, this.margin + 5, this.yPosition);
      this.yPosition += l.length * 3.5 + 1;
    }

    if (hasMultiplePosicoes) {
      const t = this.normalizeText(`-> Com ${quantidadePosicoes} posicoes, sua marca ocupa ${quantidadePosicoes}x mais espaco no ciclo de exibicao, aumentando frequencia e impacto.`);
      const l = this.doc.splitTextToSize(t, maxW);
      this.doc.text(l, this.margin + 5, this.yPosition);
      this.yPosition += l.length * 3.5 + 1;
    }

    if (isVendaFutura && prediosContratados) {
      const t = this.normalizeText(`-> Condicao especial: voce garante o preco atual, e todo o periodo ate a instalacao completa dos ${prediosContratados} predios e 100% gratuito.`);
      const l = this.doc.splitTextToSize(t, maxW);
      this.doc.text(l, this.margin + 5, this.yPosition);
      this.yPosition += l.length * 3.5 + 1;
    }

    // Box de fundo suave atras de tudo
    const totalHeight = this.yPosition - startY + 3;
    // Draw background behind (we re-draw text after)
    // Actually just add spacing
    this.yPosition += 4;
  }

  private drawBuildingsTable(buildings: any[]): void {
    const totalPanels = buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0);
    const totalImpressions = buildings.reduce((sum: number, b: any) => sum + (b.visualizacoes_mes || 0), 0);
    
    this.drawSectionTitle(`LOCAIS INCLUIDOS (${buildings.length} predios - ${totalPanels} telas)`);
    
    // Header da tabela
    this.setColor(this.colors.tableHeader, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 7, 1, 1, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'bold');
    
    // Colunas ajustadas com numeracao
    const cols = [
      { label: '#', x: this.margin + 2, w: 8 },
      { label: 'PREDIO', x: this.margin + 11, w: 52 },
      { label: 'BAIRRO', x: this.margin + 65, w: 30 },
      { label: 'ENDERECO', x: this.margin + 97, w: 45 },
      { label: 'TELAS', x: this.margin + 144, w: 14 },
      { label: 'IMP/MES', x: this.margin + 160, w: 20 }
    ];
    
    cols.forEach(col => {
      this.doc.text(col.label, col.x, this.yPosition + 5);
    });
    
    this.yPosition += 8;
    
    // Linhas da tabela com zebra
    buildings.forEach((b, index) => {
      this.checkPageBreak(7);
      
      if (index % 2 === 0) {
        this.setColor(this.colors.lightGray, 'fill');
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, 6, 'F');
      }
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      
      const num = String(index + 1);
      const nome = (b.building_name || b.nome || '').substring(0, 25);
      const bairro = (b.bairro || '').substring(0, 14);
      const endereco = (b.endereco || '').substring(0, 22);
      const telas = b.quantidade_telas || 1;
      const imp = b.visualizacoes_mes || 0;
      
      this.doc.text(num, cols[0].x, this.yPosition + 4);
      this.doc.text(nome, cols[1].x, this.yPosition + 4);
      this.doc.text(bairro, cols[2].x, this.yPosition + 4);
      this.doc.text(endereco, cols[3].x, this.yPosition + 4);
      this.doc.text(String(telas), cols[4].x, this.yPosition + 4);
      this.doc.text(imp.toLocaleString('pt-BR'), cols[5].x, this.yPosition + 4);
      
      this.yPosition += 6;
    });
    
    // Linha de totais
    this.setColor(this.colors.exaRed, 'fill');
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 7, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    
    this.doc.text('TOTAIS', cols[1].x, this.yPosition + 5);
    this.doc.text(String(totalPanels), cols[4].x, this.yPosition + 5);
    this.doc.text(totalImpressions.toLocaleString('pt-BR'), cols[5].x, this.yPosition + 5);
    
    this.yPosition += 12;
  }

  private drawCommercialConditions(proposal: ProposalData, isCortesia: boolean = false, baseTotalValue: number = 0): void {
    this.checkPageBreak(85);
    
    this.drawSectionTitle('CONDICOES COMERCIAIS');
    
    const totalFidelidade = proposal.fidel_monthly_value * proposal.duration_months;
    const monthlyEquivalent = proposal.cash_total_value / proposal.duration_months;
    
    const normalSitePrice = baseTotalValue > 0 ? baseTotalValue : totalFidelidade * 1.25;
    const savingsAmount = normalSitePrice - proposal.cash_total_value;
    const savingsPercent = normalSitePrice > 0 ? ((savingsAmount / normalSitePrice) * 100).toFixed(0) : '0';
    
    const innerPadding = 4;
    
    if (isCortesia) {
      // Container principal para cortesia
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 45, 3, 3, 'F');
      
      const boxWidth = (this.contentWidth - innerPadding * 3) / 2;
      
      // Box esquerdo - Valor original
      const leftX = this.margin + innerPadding;
      this.setColor(this.colors.white, 'fill');
      this.doc.roundedRect(leftX, this.yPosition + innerPadding, boxWidth, 37, 2, 2, 'F');
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Se fosse pago seria:', leftX + 5, this.yPosition + 12);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      const strikeValue = this.formatCurrency(baseTotalValue);
      this.doc.text(strikeValue, leftX + 5, this.yPosition + 23);
      
      // Strikethrough
      const strikeWidth = this.doc.getTextWidth(strikeValue);
      this.setColor(this.colors.exaRed, 'draw');
      this.doc.setLineWidth(0.6);
      this.doc.line(leftX + 5, this.yPosition + 21, leftX + 5 + strikeWidth, this.yPosition + 21);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.normalizeText(`Periodo: ${proposal.duration_months} meses`), leftX + 5, this.yPosition + 33);
      
      // Box direito - PRESENTE
      const rightX = this.margin + innerPadding * 2 + boxWidth;
      this.setColor(this.colors.exaRed, 'fill');
      this.doc.roundedRect(rightX, this.yPosition + innerPadding, boxWidth, 37, 2, 2, 'F');
      
      this.setColor(this.colors.white);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('SEU PRESENTE', rightX + boxWidth / 2, this.yPosition + 14, { align: 'center' });
      
      this.doc.setFontSize(18);
      this.doc.text('R$ 0,00', rightX + boxWidth / 2, this.yPosition + 28, { align: 'center' });
      
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Economia de 100%', rightX + boxWidth / 2, this.yPosition + 36, { align: 'center' });
      
      this.yPosition += 52;
    } else {
      // PROPOSTA NORMAL - Com comparacao de precos
      
      // === BOX 1: COMPARACAO DE PRECOS ===
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 26, 3, 3, 'F');
      
      // Label
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Comprando pelo site (sem proposta comercial):', this.margin + 5, this.yPosition + 8);
      
      // Valor normal riscado
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      const normalValue = this.formatCurrency(normalSitePrice);
      this.doc.text(normalValue, this.margin + 5, this.yPosition + 18);
      
      // Strikethrough
      const strikeWidth = this.doc.getTextWidth(normalValue);
      this.setColor(this.colors.exaRed, 'draw');
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin + 5, this.yPosition + 16, this.margin + 5 + strikeWidth, this.yPosition + 16);
      
      // Badge de economia
      const badgeX = this.pageWidth - this.margin - 48;
      this.setColor(this.colors.success, 'fill');
      this.doc.roundedRect(badgeX, this.yPosition + 8, 44, 12, 2, 2, 'F');
      
      this.setColor(this.colors.white);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`ECONOMIA: ${savingsPercent}%`, badgeX + 22, this.yPosition + 16, { align: 'center' });
      
      this.yPosition += 30;
      
      // === BOX 2: OPCOES DE PAGAMENTO ===
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 45, 3, 3, 'F');
      
      const boxWidth = (this.contentWidth - innerPadding * 3) / 2;
      const boxHeight = 37;
      
      // Box esquerdo - Plano Fidelidade
      const leftX = this.margin + innerPadding;
      this.setColor(this.colors.white, 'fill');
      this.doc.roundedRect(leftX, this.yPosition + innerPadding, boxWidth, boxHeight, 2, 2, 'F');
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('PLANO FIDELIDADE', leftX + 5, this.yPosition + 12);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${proposal.duration_months}x de`, leftX + 5, this.yPosition + 20);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.formatCurrency(proposal.fidel_monthly_value), leftX + 5, this.yPosition + 30);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Total: ${this.formatCurrency(totalFidelidade)}`, leftX + 5, this.yPosition + 37);
      
      // Box direito - PIX A VISTA (destaque verde)
      const rightX = this.margin + innerPadding * 2 + boxWidth;
      this.setColor(this.colors.success, 'fill');
      this.doc.roundedRect(rightX, this.yPosition + innerPadding, boxWidth, boxHeight, 2, 2, 'F');
      
      this.setColor(this.colors.white);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('PIX A VISTA (+10% OFF)', rightX + 5, this.yPosition + 12);
      
      // Valor total PIX em destaque
      this.doc.setFontSize(16);
      this.doc.text(this.formatCurrency(proposal.cash_total_value), rightX + 5, this.yPosition + 27);
      
      // Equivalencia mensal
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`(${this.formatCurrency(monthlyEquivalent)}/mes)`, rightX + 5, this.yPosition + 34);
      
      // Economia total
      this.doc.setFontSize(6);
      this.doc.text(`Economia total: ${this.formatCurrency(savingsAmount)}`, rightX + 5, this.yPosition + 40);
      
      this.yPosition += 52;
    }
  }

  // Secao de Permuta (para propostas nao-monetarias)
  private drawPermutaConditions(proposal: ProposalData): void {
    this.checkPageBreak(100);
    
    this.drawSectionTitle('ACORDO DE PERMUTA');
    
    // === BOX 1: VALOR DE REFERENCIA (quanto custaria) ===
    if (proposal.valor_referencia_monetaria && proposal.valor_referencia_monetaria > 0) {
      const periodo = proposal.is_custom_days 
        ? (proposal.custom_days || 30) / 30 
        : proposal.duration_months;
      const valorTotalReferencia = proposal.valor_referencia_monetaria * periodo;
      
      this.setColor({ r: 239, g: 246, b: 255 }, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 32, 3, 3, 'F');
      
      this.setColor({ r: 59, g: 130, b: 246 }, 'draw');
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 32, 3, 3);
      
      this.setColor({ r: 30, g: 64, b: 175 });
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.normalizeText('VALOR DO PACOTE (Referencia de Mercado)'), this.margin + 5, this.yPosition + 9);
      
      this.doc.setFontSize(14);
      this.doc.text(this.formatCurrency(valorTotalReferencia), this.margin + 5, this.yPosition + 21);
      
      this.setColor({ r: 59, g: 130, b: 246 });
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      const detalhes = proposal.is_custom_days 
        ? `${proposal.custom_days} dias`
        : `${proposal.duration_months}x de ${this.formatCurrency(proposal.valor_referencia_monetaria)}/mes`;
      this.doc.text(this.normalizeText(detalhes), this.margin + 5, this.yPosition + 28);
      
      this.yPosition += 38;
    }
    
    // === BOX 2: CONTRAPARTIDA ACORDADA ===
    // Calcular altura dinamica baseada no texto real de cada item
    const maxItemTextWidth = this.contentWidth - 55; // espaco para preco alinhado a direita
    let calculatedItemsHeight = 0;
    const itemLines: string[][] = [];
    
    if (proposal.itens_permuta && proposal.itens_permuta.length > 0) {
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      proposal.itens_permuta.forEach((item, index) => {
        const itemText = this.normalizeText(`${index + 1}. ${item.nome} (${item.quantidade}x)`);
        const lines = this.doc.splitTextToSize(itemText, maxItemTextWidth);
        itemLines.push(lines);
        calculatedItemsHeight += lines.length * 4 + 3;
      });
    }
    
    const boxHeight = 30 + calculatedItemsHeight + 8;
    
    this.checkPageBreak(boxHeight + 10);
    
    this.setColor({ r: 255, g: 251, b: 235 }, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, boxHeight, 3, 3, 'F');
    
    this.setColor({ r: 251, g: 191, b: 36 }, 'draw');
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, boxHeight, 3, 3);
    
    this.setColor({ r: 180, g: 83, b: 9 });
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CONTRAPARTIDA ACORDADA', this.margin + 5, this.yPosition + 9);
    
    this.setColor({ r: 146, g: 64, b: 14 });
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    const periodoText = proposal.is_custom_days 
      ? `Periodo: ${proposal.custom_days} ${proposal.custom_days === 1 ? 'dia' : 'dias'}.`
      : `Periodo: ${proposal.duration_months} ${proposal.duration_months === 1 ? 'mes' : 'meses'}.`;
    this.doc.text(this.normalizeText(periodoText), this.margin + 5, this.yPosition + 16);
    
    // Lista de itens com quebra de linha
    let itemY = this.yPosition + 24;
    if (proposal.itens_permuta && proposal.itens_permuta.length > 0) {
      proposal.itens_permuta.forEach((item, index) => {
        const lines = itemLines[index];
        
        this.setColor({ r: 146, g: 64, b: 14 });
        this.doc.setFontSize(7);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(lines, this.margin + 8, itemY);
        
        if (!proposal.ocultar_valores_publico && !item.ocultar_preco) {
          this.setColor({ r: 180, g: 83, b: 9 });
          this.doc.setFont('helvetica', 'normal');
          this.doc.text(this.formatCurrency(item.preco_total), this.pageWidth - this.margin - 5, itemY, { align: 'right' });
        }
        
        itemY += lines.length * 4 + 3;
      });
    }
    
    // Valor total
    if (!proposal.ocultar_valores_publico && proposal.valor_total_permuta && proposal.valor_total_permuta > 0) {
      this.setColor({ r: 180, g: 83, b: 9 });
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Total Estimado: ${this.formatCurrency(proposal.valor_total_permuta)}`, this.margin + 5, itemY + 2);
    }
    
    this.yPosition += boxHeight + 6;
    
    // Descricao da contrapartida
    if (proposal.descricao_contrapartida) {
      const descLines = this.doc.splitTextToSize(`"${this.normalizeText(proposal.descricao_contrapartida)}"`, this.contentWidth - 10);
      const descHeight = descLines.length * 3.5 + 8;
      
      this.checkPageBreak(descHeight + 5);
      
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, descHeight, 2, 2, 'F');
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(descLines, this.margin + 5, this.yPosition + 7);
      
      this.yPosition += descHeight + 4;
    }
  }

  // NOVO: Marcas parceiras (prova social textual)
  private drawPartnerLogosSection(): void {
    this.checkPageBreak(18);
    
    this.drawSectionTitle('MARCAS QUE CONFIAM NA EXA');
    
    const partnerText = this.normalizeText(
      'AASC | Black Bill | Secovi-PR | Portal da Cidade | Shopping China | Grupo Kammer | Splendore Alimentos | Magazine Luiza | Pax Primavera | Mili | Supermercado Muffato | Sicredi | Unimed | Gazin | Itaipu Binacional'
    );
    
    this.setColor(this.colors.lightGray, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 10, 2, 2, 'F');
    
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(partnerText, this.contentWidth - 10);
    this.doc.text(lines, this.margin + 5, this.yPosition + 5);
    
    this.yPosition += 14;
  }

  // Secao "Conheca a EXA" com botoes CLICAVEIS
  private drawVideoLinksSection(): void {
    this.checkPageBreak(55);
    
    this.drawSectionTitle('CONHECA A EXA MIDIA');
    
    // Subtitulo contextual
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text(this.normalizeText('Saiba mais sobre a EXA Midia e nosso portfolio de solucoes:'), this.margin + 2, this.yPosition);
    this.yPosition += 5;
    
    const links = [
      { 
        label: 'Assistir Video Institucional', 
        url: 'https://drive.google.com/file/d/19g-1y4dzi60ydc5yXJKDD6sW6MPpyCaZ/view?usp=drive_link'
      },
      { 
        label: 'Ver Midia Kit Completo', 
        url: 'https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view?usp=drive_link'
      },
      { 
        label: 'Visitar Nosso Site', 
        url: 'https://www.examidia.com.br'
      },
      { 
        label: 'Quem Somos', 
        url: 'https://www.examidia.com.br/quem-somos'
      },
      { 
        label: 'Mais Videos da EXA', 
        url: 'https://drive.google.com/drive/folders/1GgZwyYLZdlqvCqElaaWJQ9BEbYPNMkmR?usp=sharing'
      }
    ];
    
    links.forEach((link, index) => {
      const y = this.yPosition + (index * 8);
      
      this.setColor(this.colors.lightGray, 'fill');
      this.doc.roundedRect(this.margin, y, this.contentWidth, 7, 1, 1, 'F');
      
      this.setColor({ r: 200, g: 200, b: 200 }, 'draw');
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(this.margin, y, this.contentWidth, 7, 1, 1);
      
      this.setColor({ r: 59, g: 130, b: 246 });
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.normalizeText(link.label), this.margin + 4, y + 5);
      
      this.doc.link(this.margin, y, this.contentWidth, 7, { url: link.url });
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.text('>', this.pageWidth - this.margin - 6, y + 5);
    });
    
    this.yPosition += links.length * 8 + 5;
  }

  private drawGeneralConditions(specs: ProductSpecs): void {
    this.checkPageBreak(40);
    
    this.drawSectionTitle('CONDICOES GERAIS');
    
    // Condicoes DINAMICAS baseadas no tipo de produto - normalizadas
    const conditions = [
      `- Video publicitario de ate ${specs.duracao} segundos, formato ${specs.formato} ${specs.proporcao} (${specs.resolucao}).`,
      '- Aprovacao do conteudo em ate 48 horas uteis.',
      '- Relatorio mensal de impressoes disponivel na plataforma.',
      '- Possibilidade de troca de video durante a campanha.',
      '- Exibicao em rotacao com outros anunciantes (~195s por ciclo).',
      '- Suporte tecnico via WhatsApp em horario comercial.'
    ];
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    
    conditions.forEach((condition, index) => {
      this.doc.text(this.normalizeText(condition), this.margin + 2, this.yPosition + (index * 5));
    });
    
    this.yPosition += conditions.length * 5 + 6;
  }

  private async drawFooter(proposal: ProposalData, sellerName: string, sellerPhone: string, isCortesia: boolean = false): Promise<void> {
    const footerY = this.pageHeight - 38;
    
    // Linha separadora
    this.setColor(this.colors.lightGray, 'draw');
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 3, this.pageWidth - this.margin, footerY - 3);
    
    // QR Code
    try {
      const qrCodeDataUrl = await this.generateValidationQRCode(proposal.id);
      this.doc.addImage(qrCodeDataUrl, 'PNG', this.margin, footerY, 20, 20);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
    }
    
    // Texto ao lado do QR
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Escaneie para visualizar', this.margin + 23, footerY + 5);
    this.doc.text('esta proposta online', this.margin + 23, footerY + 9);
    
    // Numero da proposta
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(proposal.number, this.margin + 23, this.yPosition > footerY ? footerY + 15 : footerY + 14);
    
    // Validade
    if (proposal.expires_at) {
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(5);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.normalizeText(`Valida ate: ${new Date(proposal.expires_at).toLocaleString('pt-BR')}`), this.margin + 23, footerY + 18);
    }
    
    // Contato do Vendedor - lado direito
    const rightX = this.pageWidth - this.margin;
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Contato Comercial', rightX, footerY + 3, { align: 'right' });
    
    // Nome do vendedor em negrito
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(sellerName || 'Equipe EXA', rightX, footerY + 9, { align: 'right' });
    
    // Telefone do vendedor
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(sellerPhone || '(45) 99141-5856', rightX, footerY + 14, { align: 'right' });
    this.doc.text('www.examidia.com.br', rightX, footerY + 18, { align: 'right' });
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
    
    // Buscar especificacoes dinamicas do banco
    const specs = await this.fetchProductSpecs(tipoProduto);
    
    // PAGINA 1
    // Header elegante (com logos EXA e Cliente)
    await this.drawElegantHeader(proposal, sellerName, isCortesia);
    
    // Identificacao da proposta
    this.drawProposalIdentification(proposal, isCortesia);
    
    // Dados do cliente
    this.drawClientInfo(proposal, isCortesia);
    
    // Tabela de predios
    const buildings = proposal.selected_buildings || [];
    const totalPanels = buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0);
    const quantidadePosicoes = proposal.quantidade_posicoes || 1;
    
    // MODULO DE PRODUTO (com info de posicoes)
    await this.drawProductShowcase(specs, tipoProduto, totalPanels, quantidadePosicoes);
    
    // NOVO: Resumo executivo (texto explicativo completo)
    this.drawSummaryText(proposal, specs);
    
    // Tabela de predios
    this.drawBuildingsTable(buildings);
    
    // Condicoes comerciais - diferenciado por modalidade
    if (proposal.modalidade_proposta === 'permuta') {
      this.drawPermutaConditions(proposal);
    } else {
      this.drawCommercialConditions(proposal, isCortesia, baseTotalValue);
    }
    
    // NOVO: Marcas parceiras (prova social textual)
    this.drawPartnerLogosSection();
    
    // PAGINA 2 (se necessario, adiciona automaticamente)
    // Links de video com botoes CLICAVEIS (com subtitulo)
    this.drawVideoLinksSection();
    
    // Condicoes gerais - DINAMICAS (com pontuacao corrigida)
    this.drawGeneralConditions(specs);
    
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
