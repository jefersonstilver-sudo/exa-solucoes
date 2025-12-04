import jsPDF from 'jspdf';

interface ContractData {
  id: string;
  numero_contrato: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_cnpj?: string | null;
  cliente_razao_social?: string | null;
  cliente_telefone?: string | null;
  cliente_segmento?: string | null;
  cliente_endereco?: string | null;
  cliente_cidade?: string | null;
  lista_predios?: any[];
  total_paineis?: number;
  valor_mensal?: number | null;
  valor_total?: number | null;
  plano_meses?: number | null;
  metodo_pagamento?: string | null;
  dia_vencimento?: number | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  objeto?: string | null;
  clausulas_especiais?: string | null;
  parcelas?: any[];
  tipo_produto?: string | null;
  status: string;
  created_at: string;
}

export class ContractPDFExporter {
  private doc: jsPDF;
  private yPosition: number = 0;
  private readonly pageWidth = 210;
  private readonly pageHeight = 297;
  private readonly margin = 15;
  private readonly contentWidth = this.pageWidth - (this.margin * 2);

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

  private formatDateExtended(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                     'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  }

  private checkPageBreak(height: number): boolean {
    if (this.yPosition + height > this.pageHeight - 30) {
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

  private async drawHeader(contract: ContractData): Promise<void> {
    // Fundo branco
    this.setColor(this.colors.white, 'fill');
    this.doc.rect(0, 0, this.pageWidth, 42, 'F');
    
    // Logo EXA
    try {
      const logoUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';
      const dataUrl = await this.loadImageAsDataURL(logoUrl);
      this.doc.addImage(dataUrl, 'PNG', this.margin, 10, 35, 22);
    } catch {
      this.setColor(this.colors.exaRed);
      this.doc.setFontSize(24);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('EXA', this.margin + 5, 26);
    }
    
    // Título central
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', this.pageWidth / 2, 16, { align: 'center' });
    
    // Subtítulo
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Publicidade em Mídia Digital Indoor', this.pageWidth / 2, 24, { align: 'center' });
    
    // Data e número no lado direito
    const rightX = this.pageWidth - this.margin;
    this.doc.setFontSize(8);
    this.setColor(this.colors.mediumGray);
    this.doc.text(`Emitido: ${this.formatDate(contract.created_at)}`, rightX, 12, { align: 'right' });
    
    this.setColor(this.colors.exaRed);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${contract.numero_contrato}`, rightX, 20, { align: 'right' });
    
    // Linha separadora
    this.setColor(this.colors.exaRed, 'draw');
    this.doc.setLineWidth(1.5);
    this.doc.line(this.margin, 40, this.pageWidth - this.margin, 40);
    
    this.yPosition = 48;
  }

  private drawSectionTitle(title: string): void {
    this.checkPageBreak(12);
    
    this.setColor(this.colors.exaRed, 'draw');
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition, this.margin + 3, this.yPosition);
    
    this.setColor(this.colors.exaRed);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 5, this.yPosition + 4);
    
    const titleWidth = this.doc.getTextWidth(title);
    this.doc.line(this.margin + 8 + titleWidth, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    
    this.yPosition += 10;
  }

  private drawContractorInfo(): void {
    this.drawSectionTitle('CONTRATADA');
    
    const startY = this.yPosition;
    
    this.setColor(this.colors.lightGray, 'fill');
    this.doc.roundedRect(this.margin, startY, this.contentWidth, 22, 2, 2, 'F');
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('EXA MÍDIA LTDA', this.margin + 5, startY + 8);
    
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('CNPJ: 42.538.968/0001-06', this.margin + 5, startY + 14);
    this.doc.text('Av. Paraná, 3695 - 2º Andar, Centro - Foz do Iguaçu/PR', this.margin + 5, startY + 19);
    
    this.yPosition = startY + 28;
  }

  private drawClientInfo(contract: ContractData): void {
    this.drawSectionTitle('CONTRATANTE');
    
    const startY = this.yPosition;
    const colWidth = this.contentWidth / 2;
    
    const leftItems = [
      { label: 'Nome/Razão Social', value: contract.cliente_razao_social || contract.cliente_nome },
      { label: 'CNPJ/CPF', value: contract.cliente_cnpj || 'Não informado' },
      { label: 'Segmento', value: contract.cliente_segmento || 'Não informado' },
    ];
    
    const rightItems = [
      { label: 'Responsável', value: contract.cliente_nome },
      { label: 'Telefone', value: contract.cliente_telefone || 'Não informado' },
      { label: 'E-mail', value: contract.cliente_email },
    ];
    
    leftItems.forEach((item, index) => {
      const y = startY + (index * 12);
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.label, this.margin, y + 4);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.value, this.margin, y + 10);
    });
    
    rightItems.forEach((item, index) => {
      const y = startY + (index * 12);
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
    
    this.yPosition = startY + 40;
  }

  private drawObject(contract: ContractData): void {
    this.drawSectionTitle('OBJETO DO CONTRATO');
    
    const objeto = contract.objeto || 
      `Prestação de serviços de veiculação de publicidade em mídia digital indoor (painéis digitais em elevadores), conforme especificações detalhadas neste instrumento.`;
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    
    const lines = this.doc.splitTextToSize(objeto, this.contentWidth);
    lines.forEach((line: string) => {
      this.checkPageBreak(6);
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += 5;
    });
    
    this.yPosition += 5;
  }

  private drawBuildingsTable(buildings: any[]): void {
    const totalPanels = buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0);
    
    this.drawSectionTitle(`LOCAIS DE VEICULAÇÃO (${buildings.length} prédios • ${totalPanels} telas)`);
    
    // Header da tabela
    this.setColor(this.colors.tableHeader, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 8, 1, 1, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    
    const cols = [
      { label: 'PRÉDIO', x: this.margin + 3, w: 65 },
      { label: 'BAIRRO', x: this.margin + 70, w: 40 },
      { label: 'ENDEREÇO', x: this.margin + 112, w: 50 },
      { label: 'TELAS', x: this.margin + 164, w: 15 }
    ];
    
    cols.forEach(col => {
      this.doc.text(col.label, col.x, this.yPosition + 5.5);
    });
    
    this.yPosition += 10;
    
    buildings.forEach((b, index) => {
      this.checkPageBreak(8);
      
      if (index % 2 === 0) {
        this.setColor(this.colors.lightGray, 'fill');
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, 7, 'F');
      }
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      
      const nome = (b.building_name || b.nome || '').substring(0, 32);
      const bairro = (b.bairro || '').substring(0, 18);
      const endereco = (b.endereco || '').substring(0, 24);
      const telas = b.quantidade_telas || 1;
      
      this.doc.text(nome, cols[0].x, this.yPosition + 5);
      this.doc.text(bairro, cols[1].x, this.yPosition + 5);
      this.doc.text(endereco, cols[2].x, this.yPosition + 5);
      this.doc.text(String(telas), cols[3].x, this.yPosition + 5);
      
      this.yPosition += 7;
    });
    
    // Linha de totais
    this.setColor(this.colors.exaRed, 'fill');
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 8, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    
    this.doc.text(`TOTAL: ${buildings.length} PRÉDIOS`, cols[0].x, this.yPosition + 5.5);
    this.doc.text(String(totalPanels), cols[3].x, this.yPosition + 5.5);
    
    this.yPosition += 14;
  }

  private drawFinancialConditions(contract: ContractData): void {
    this.checkPageBreak(50);
    this.drawSectionTitle('CONDIÇÕES FINANCEIRAS');
    
    const startY = this.yPosition;
    const isCustom = contract.metodo_pagamento === 'custom';
    
    // Box de valores
    this.setColor(this.colors.lightGray, 'fill');
    this.doc.roundedRect(this.margin, startY, this.contentWidth, isCustom ? 35 : 45, 3, 3, 'F');
    
    if (isCustom) {
      // Para condição personalizada, mostrar apenas total e tipo
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Condição de Pagamento', this.margin + 10, startY + 12);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('CONDIÇÃO PERSONALIZADA', this.margin + 10, startY + 22);
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Valor Total', this.margin + 120, startY + 12);
      
      this.setColor(this.colors.exaRed);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.formatCurrency(contract.valor_total || 0), this.margin + 120, startY + 22);
      
      this.yPosition = startY + 42;
    } else {
      const colWidth = this.contentWidth / 3;
      
      // Valor Mensal
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Valor Mensal', this.margin + 10, startY + 12);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.formatCurrency(contract.valor_mensal || 0), this.margin + 10, startY + 22);
      
      // Duração
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Duração', this.margin + colWidth + 10, startY + 12);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${contract.plano_meses || 1} meses`, this.margin + colWidth + 10, startY + 22);
      
      // Valor Total
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Valor Total', this.margin + colWidth * 2 + 10, startY + 12);
      
      this.setColor(this.colors.exaRed);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.formatCurrency(contract.valor_total || 0), this.margin + colWidth * 2 + 10, startY + 22);
      
      // Método de pagamento
      const metodoPagamento = {
        'pix_avista': 'PIX à Vista',
        'pix_fidelidade': 'PIX Fidelidade',
        'boleto_fidelidade': 'Boleto Fidelidade',
        'cartao': 'Cartão de Crédito',
      }[contract.metodo_pagamento || ''] || contract.metodo_pagamento || 'Não definido';
      
      this.setColor(this.colors.mediumGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Forma de Pagamento:', this.margin + 10, startY + 34);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metodoPagamento, this.margin + 50, startY + 34);
      
      if (contract.dia_vencimento) {
        this.doc.text(`| Vencimento: Dia ${contract.dia_vencimento}`, this.margin + 110, startY + 34);
      }
      
      this.yPosition = startY + 52;
    }
  }

  private drawInstallments(contract: ContractData): void {
    const parcelas = contract.parcelas || [];
    if (parcelas.length === 0 && contract.metodo_pagamento !== 'custom') return;
    
    this.checkPageBreak(30);
    this.drawSectionTitle('CRONOGRAMA DE PAGAMENTOS');
    
    // Header
    this.setColor(this.colors.tableHeader, 'fill');
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 7, 1, 1, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PARCELA', this.margin + 5, this.yPosition + 5);
    this.doc.text('VENCIMENTO', this.margin + 70, this.yPosition + 5);
    this.doc.text('VALOR', this.margin + 140, this.yPosition + 5);
    
    this.yPosition += 9;
    
    parcelas.forEach((p: any, idx: number) => {
      this.checkPageBreak(7);
      
      if (idx % 2 === 0) {
        this.setColor(this.colors.lightGray, 'fill');
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, 6, 'F');
      }
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${p.installment || idx + 1}ª parcela`, this.margin + 5, this.yPosition + 4.5);
      this.doc.text(this.formatDateExtended(p.due_date), this.margin + 70, this.yPosition + 4.5);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.formatCurrency(Number(p.amount)), this.margin + 140, this.yPosition + 4.5);
      
      this.yPosition += 6;
    });
    
    this.yPosition += 6;
  }

  private drawContractClauses(contract: ContractData): void {
    this.checkPageBreak(100);
    this.drawSectionTitle('CLÁUSULAS CONTRATUAIS');
    
    const clauses = [
      {
        title: '1. DA VIGÊNCIA',
        content: `O presente contrato terá vigência de ${contract.plano_meses || 1} (${this.getNumeroExtenso(contract.plano_meses || 1)}) meses, com início em ${contract.data_inicio ? this.formatDateExtended(contract.data_inicio) : '[data de aprovação do primeiro vídeo]'}.`
      },
      {
        title: '2. DO CONTEÚDO',
        content: 'O CONTRATANTE é integralmente responsável pelo conteúdo publicitário veiculado, isentando a CONTRATADA de qualquer responsabilidade sobre o material apresentado.'
      },
      {
        title: '3. DAS ESPECIFICAÇÕES TÉCNICAS',
        content: 'Os vídeos devem ter: duração de 15 segundos, formato horizontal (16:9), resolução mínima de 1920x1080, sem áudio.'
      },
      {
        title: '4. DA APROVAÇÃO',
        content: 'O material publicitário está sujeito à aprovação da CONTRATADA e das administrações condominiais, que poderão recusar conteúdos inadequados.'
      },
      {
        title: '5. DO PAGAMENTO',
        content: `Os pagamentos deverão ser realizados conforme condição estabelecida neste instrumento. O não pagamento acarretará suspensão imediata da veiculação após ${contract.metodo_pagamento === 'pix_avista' ? 'o vencimento' : '10 dias de inadimplência'}.`
      },
      {
        title: '6. DA RESCISÃO',
        content: 'A rescisão antecipada por parte do CONTRATANTE implicará no pagamento de multa equivalente a 30% do valor restante do contrato.'
      },
      {
        title: '7. DO USO DE IMAGEM',
        content: 'O CONTRATANTE autoriza a EXA MÍDIA a utilizar imagens e vídeos de suas campanhas para fins de divulgação e portfólio, preservando sempre a integridade da marca.'
      }
    ];
    
    clauses.forEach(clause => {
      this.checkPageBreak(25);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(clause.title, this.margin, this.yPosition);
      this.yPosition += 5;
      
      this.doc.setFont('helvetica', 'normal');
      const lines = this.doc.splitTextToSize(clause.content, this.contentWidth);
      lines.forEach((line: string) => {
        this.checkPageBreak(5);
        this.doc.text(line, this.margin, this.yPosition);
        this.yPosition += 4.5;
      });
      
      this.yPosition += 3;
    });
    
    // Cláusulas especiais
    if (contract.clausulas_especiais) {
      this.checkPageBreak(30);
      
      this.setColor(this.colors.darkGray);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('8. CLÁUSULAS ESPECIAIS', this.margin, this.yPosition);
      this.yPosition += 5;
      
      this.doc.setFont('helvetica', 'normal');
      const lines = this.doc.splitTextToSize(contract.clausulas_especiais, this.contentWidth);
      lines.forEach((line: string) => {
        this.checkPageBreak(5);
        this.doc.text(line, this.margin, this.yPosition);
        this.yPosition += 4.5;
      });
      
      this.yPosition += 5;
    }
  }

  private getNumeroExtenso(num: number): string {
    const extenso: Record<number, string> = {
      1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
      6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
      11: 'onze', 12: 'doze'
    };
    return extenso[num] || String(num);
  }

  private drawSignatureArea(contract: ContractData): void {
    this.checkPageBreak(80);
    this.yPosition += 10;
    
    const dataAtual = new Date().toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Foz do Iguaçu/PR, ${dataAtual}`, this.pageWidth / 2, this.yPosition, { align: 'center' });
    
    this.yPosition += 20;
    
    const colWidth = this.contentWidth / 2;
    
    // Assinatura CONTRATADA
    this.setColor(this.colors.darkGray, 'draw');
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin + 10, this.yPosition, this.margin + colWidth - 10, this.yPosition);
    
    this.setColor(this.colors.darkGray);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('EXA MÍDIA LTDA', this.margin + colWidth / 2, this.yPosition + 6, { align: 'center' });
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.text('CONTRATADA', this.margin + colWidth / 2, this.yPosition + 11, { align: 'center' });
    
    // Assinatura CONTRATANTE
    this.doc.line(this.margin + colWidth + 10, this.yPosition, this.pageWidth - this.margin - 10, this.yPosition);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(contract.cliente_nome, this.margin + colWidth + colWidth / 2, this.yPosition + 6, { align: 'center' });
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.text('CONTRATANTE', this.margin + colWidth + colWidth / 2, this.yPosition + 11, { align: 'center' });
  }

  private drawFooter(): void {
    const footerY = this.pageHeight - 10;
    
    this.setColor(this.colors.mediumGray);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('EXA Mídia LTDA | CNPJ: 42.538.968/0001-06 | contato@examidia.com.br | (45) 99814-1585', 
      this.pageWidth / 2, footerY, { align: 'center' });
  }

  private drawDraftWatermark(): void {
    // Marca d'água diagonal em todas as páginas
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.saveGraphicsState();
      
      // Texto diagonal
      this.doc.setFontSize(60);
      this.doc.setTextColor(220, 220, 220);
      this.doc.setFont('helvetica', 'bold');
      
      // Rotacionar e posicionar no centro
      const text = 'RASCUNHO';
      const centerX = this.pageWidth / 2;
      const centerY = this.pageHeight / 2;
      
      // jsPDF não suporta rotação de texto diretamente, então desenhamos múltiplas vezes
      this.doc.text(text, centerX - 50, centerY - 30, { angle: 45 });
      
      this.doc.restoreGraphicsState();
    }
  }

  private drawStatusBadge(contract: ContractData): void {
    // Badge de status no canto superior direito
    const statusText = contract.status === 'assinado' ? '✓ ASSINADO' : '⚠ NÃO ASSINADO';
    const statusColor = contract.status === 'assinado' ? this.colors.success : { r: 200, g: 150, b: 0 };
    
    const badgeWidth = 35;
    const badgeHeight = 8;
    const badgeX = this.pageWidth - this.margin - badgeWidth;
    const badgeY = 28;
    
    this.setColor(statusColor, 'fill');
    this.doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
    
    this.setColor(this.colors.white);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(statusText, badgeX + badgeWidth / 2, badgeY + 5.5, { align: 'center' });
  }

  public async generateContractPDF(contract: ContractData): Promise<void> {
    this.doc = new jsPDF();
    this.yPosition = 0;
    
    // Header
    await this.drawHeader(contract);
    
    // Badge de status
    this.drawStatusBadge(contract);
    
    // Identificação das partes
    this.drawContractorInfo();
    this.drawClientInfo(contract);
    
    // Objeto
    this.drawObject(contract);
    
    // Prédios
    const buildings = contract.lista_predios || [];
    if (buildings.length > 0) {
      this.drawBuildingsTable(buildings);
    }
    
    // Condições financeiras
    this.drawFinancialConditions(contract);
    
    // Parcelas (se houver)
    this.drawInstallments(contract);
    
    // Cláusulas
    this.drawContractClauses(contract);
    
    // Assinaturas
    this.drawSignatureArea(contract);
    
    // Footer em todas as páginas
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.drawFooter();
    }
    
    // Marca d'água se não assinado
    if (contract.status !== 'assinado') {
      this.drawDraftWatermark();
    }
    
    // Download
    const suffix = contract.status === 'assinado' ? '' : '_rascunho';
    this.doc.save(`${contract.numero_contrato}${suffix}.pdf`);
  }
}
