import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';

export interface CampaignPDFData {
  pedidoId: string;
  clientName: string;
  clientEmail: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  progress: number;
  totalExibicoes: number;
  totalHoras: number;
  totalPredios: number;
  videos: {
    nome: string;
    duracao: number;
    horasExibidas: number;
    approvalStatus: string;
  }[];
  predios: {
    nome: string;
    endereco: string;
    bairro: string;
  }[];
  chartElementId?: string;
}

export class CampaignPDFExporter {
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
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  }

  private checkPageBreak(height: number): void {
    if (this.yPosition + height > this.pageHeight - this.margin - 25) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  private async drawHeader(): Promise<void> {
    // Header vermelho EXA
    this.doc.setFillColor(156, 30, 30);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('EXA MÍDIA', this.pageWidth / 2, 15, { align: 'center' });

    this.doc.setFontSize(14);
    this.doc.text('RELATÓRIO DE CAMPANHA', this.pageWidth / 2, 28, { align: 'center' });

    this.doc.setFontSize(10);
    const reportDate = format(new Date(), 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR });
    this.doc.text(reportDate, this.pageWidth / 2, 36, { align: 'center' });

    this.yPosition = 50;
  }

  private drawSection(title: string): void {
    this.checkPageBreak(14);

    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(this.margin, this.yPosition - 1, this.contentWidth, 10, 'F');

    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.yPosition - 1, this.pageWidth - this.margin, this.yPosition - 1);

    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 2, this.yPosition + 5);

    this.yPosition += 12;
  }

  private drawInfoRow(label: string, value: string): void {
    this.checkPageBreak(6);

    this.doc.setTextColor(107, 114, 128);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(label + ':', this.margin + 2, this.yPosition + 3);

    this.doc.setTextColor(31, 41, 55);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(value, this.margin + 50, this.yPosition + 3);

    this.yPosition += 7;
  }

  private drawMetricsGrid(data: CampaignPDFData): void {
    this.checkPageBreak(30);

    const metrics = [
      { label: 'Exibições Totais', value: data.totalExibicoes.toLocaleString('pt-BR') },
      { label: 'Horas Exibidas', value: `${data.totalHoras.toFixed(1)}h` },
      { label: 'Prédios Ativos', value: data.totalPredios.toString() },
      { label: 'Progresso', value: `${data.progress.toFixed(0)}%` }
    ];

    const boxWidth = (this.contentWidth - 6) / 2;
    const boxHeight = 20;

    metrics.forEach((metric, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = this.margin + (col * (boxWidth + 3));
      const y = this.yPosition + (row * (boxHeight + 3));

      // Box
      this.doc.setFillColor(254, 242, 242);
      this.doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');

      this.doc.setDrawColor(156, 30, 30);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2);

      // Label
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(metric.label, x + 3, y + 7);

      // Value
      this.doc.setTextColor(156, 30, 30);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metric.value, x + 3, y + 15);
    });

    this.yPosition += (Math.ceil(metrics.length / 2) * (boxHeight + 3)) + 5;
  }

  private drawTable(headers: string[], rows: string[][]): void {
    const colWidths = headers.map(() => this.contentWidth / headers.length);

    this.checkPageBreak(12 + (rows.length * 6));

    // Header
    this.doc.setFillColor(156, 30, 30);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, 8, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');

    let currentX = this.margin;
    headers.forEach((header, index) => {
      this.doc.text(header, currentX + 2, this.yPosition + 5);
      currentX += colWidths[index];
    });

    this.yPosition += 10;

    // Rows
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(6);

      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(249, 250, 251);
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, 6, 'F');
      }

      this.doc.setTextColor(31, 41, 55);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');

      let currentX = this.margin;
      row.forEach((cell, cellIndex) => {
        const cellText = cell.length > 30 ? cell.substring(0, 27) + '...' : cell;
        this.doc.text(cellText, currentX + 2, this.yPosition + 4);
        currentX += colWidths[cellIndex];
      });

      this.yPosition += 6;
    });

    this.yPosition += 5;
  }

  private async captureChart(elementId: string): Promise<string | null> {
    const element = document.getElementById(elementId);
    if (!element) return null;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Erro ao capturar gráfico:', error);
      return null;
    }
  }

  private async addFooter(): Promise<void> {
    const totalPages = this.doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      const footerY = this.pageHeight - 20;

      this.doc.setDrawColor(229, 231, 235);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);

      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');

      this.doc.text('EXA Mídia - Publicidade Inteligente', this.margin, footerY + 6);
      this.doc.text('www.examidia.com.br', this.margin, footerY + 10);

      const pageText = `Página ${i}/${totalPages}`;
      const pageWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, (this.pageWidth - pageWidth) / 2, footerY + 8);

      const emittedText = `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;
      const emittedWidth = this.doc.getTextWidth(emittedText);
      this.doc.text(emittedText, this.pageWidth - this.margin - emittedWidth, footerY + 8);
    }
  }

  public async generateReport(data: CampaignPDFData): Promise<Blob> {
    // Header
    await this.drawHeader();

    // Informações do Pedido
    this.drawSection('INFORMAÇÕES DA CAMPANHA');
    this.drawInfoRow('ID do Pedido', `#${data.pedidoId.substring(0, 8)}`);
    this.drawInfoRow('Cliente', data.clientName);
    this.drawInfoRow('Email', data.clientEmail);
    this.drawInfoRow('Status', data.status);
    this.drawInfoRow('Período', `${this.formatDate(data.dataInicio)} até ${this.formatDate(data.dataFim)}`);

    this.yPosition += 5;

    // Métricas Principais
    this.drawSection('MÉTRICAS PRINCIPAIS');
    this.drawMetricsGrid(data);

    this.yPosition += 5;

    // Gráfico (se disponível)
    if (data.chartElementId) {
      this.drawSection('EVOLUÇÃO DA CAMPANHA');
      const chartImage = await this.captureChart(data.chartElementId);
      if (chartImage) {
        this.checkPageBreak(100);
        this.doc.addImage(chartImage, 'PNG', this.margin, this.yPosition, this.contentWidth, 80);
        this.yPosition += 85;
      }
    }

    // Lista de Vídeos
    this.drawSection('VÍDEOS DA CAMPANHA');
    const videoHeaders = ['Nome do Vídeo', 'Duração', 'Horas Exibidas', 'Status'];
    const videoRows = data.videos.map(v => [
      v.nome,
      `${v.duracao}s`,
      `${v.horasExibidas.toFixed(1)}h`,
      v.approvalStatus === 'approved' ? 'Aprovado' : v.approvalStatus === 'pending' ? 'Pendente' : 'Rejeitado'
    ]);
    this.drawTable(videoHeaders, videoRows);

    // Lista de Prédios
    this.drawSection('PRÉDIOS ATIVOS');
    const buildingHeaders = ['Nome do Prédio', 'Endereço', 'Bairro'];
    const buildingRows = data.predios.map(p => [
      p.nome,
      p.endereco,
      p.bairro
    ]);
    this.drawTable(buildingHeaders, buildingRows);

    // Footer
    await this.addFooter();

    return this.doc.output('blob');
  }
}
