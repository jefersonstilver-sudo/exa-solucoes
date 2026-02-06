import html2canvas from 'html2canvas';
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
  cliente_cargo?: string | null;
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
  tipo_contrato?: string;
  status: string;
  created_at: string;
}

export class ContractPDFExporter {
  /**
   * VERSÃO 3.0 - Canvas Único com Pontos de Quebra Seguros
   * 
   * Captura TODO o HTML em um canvas único e divide em páginas
   * usando pontos de quebra seguros (entre linhas de tabela, parágrafos, etc.)
   * Isso evita distorção vertical e cortes no meio de elementos.
   */
  static async exportFromElement(element: HTMLElement, filename: string): Promise<void> {
    try {
      console.log('📄 [ContractPDFExporter v3.0] Iniciando exportação com pontos de quebra seguros...');
      
      // Dimensões A4 em mm
      const pageWidthMM = 210;
      const pageHeightMM = 297;
      const marginMM = 12;
      const contentWidthMM = pageWidthMM - (marginMM * 2); // 186mm
      const contentHeightMM = pageHeightMM - (marginMM * 2); // 273mm
      
      // Criar container temporário com largura fixa
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 794px;
        background: white;
        padding: 40px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1a1a1a;
      `;
      
      // Clonar conteúdo e adicionar estilos para word-break
      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { 
          word-break: break-word; 
          overflow-wrap: break-word; 
          padding: 8px 10px; 
          border: 1px solid #d1d5db; 
        }
        p, .info-value { 
          word-break: break-word; 
          overflow-wrap: break-word; 
        }
      `;
      tempContainer.appendChild(style);
      
      const contentClone = element.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(contentClone);
      document.body.appendChild(tempContainer);

      // Aguardar renderização
      await new Promise(r => setTimeout(r, 100));

      // Capturar canvas completo
      console.log('📸 [ContractPDFExporter v3.0] Capturando canvas completo...');
      
      const fullCanvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794
      });

      console.log(`📐 [ContractPDFExporter v3.0] Canvas: ${fullCanvas.width}x${fullCanvas.height}px`);

      // Identificar pontos de quebra seguros
      const breakableElements = tempContainer.querySelectorAll(
        'tr, p, .section, .clause, .info-row, .signature-section, .witnesses-section, h2, h3, .section-title'
      );
      
      const containerRect = tempContainer.getBoundingClientRect();
      const elementBottoms: number[] = [];
      
      breakableElements.forEach(el => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        // Usar rect.top para cortar ANTES do elemento, eliminando linha fantasma
        const relativeTop = rect.top - containerRect.top;
        if (relativeTop > 0) {
          elementBottoms.push(relativeTop);
        }
      });
      
      const sortedBreaks = [...new Set(elementBottoms)].sort((a, b) => a - b);
      console.log(`📍 [ContractPDFExporter v3.0] ${sortedBreaks.length} pontos de quebra identificados`);

      // Configurações de escala
      const canvasScale = 2;
      const domWidthPx = 794;
      const pxPerMM = domWidthPx / contentWidthMM;
      const maxDomHeightPerPage = contentHeightMM * pxPerMM;

      // Calcular quebras de página
      const pageBreaks: number[] = [0];
      let lastBreak = 0;
      
      for (const breakPoint of sortedBreaks) {
        if (breakPoint - lastBreak > maxDomHeightPerPage) {
          const previousSafe = sortedBreaks
            .filter(bp => bp > lastBreak && bp <= lastBreak + maxDomHeightPerPage)
            .pop();
          
          if (previousSafe && previousSafe !== lastBreak) {
            pageBreaks.push(previousSafe);
            lastBreak = previousSafe;
          } else {
            pageBreaks.push(lastBreak + maxDomHeightPerPage);
            lastBreak = lastBreak + maxDomHeightPerPage;
          }
        }
      }
      
      const totalDomHeight = tempContainer.scrollHeight;
      if (pageBreaks[pageBreaks.length - 1] < totalDomHeight) {
        pageBreaks.push(totalDomHeight);
      }

      console.log(`📄 [ContractPDFExporter v3.0] ${pageBreaks.length - 1} páginas calculadas`);

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Renderizar cada página
      for (let pageIndex = 0; pageIndex < pageBreaks.length - 1; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const startY = pageBreaks[pageIndex];
        const endY = pageBreaks[pageIndex + 1];
        const sliceHeight = endY - startY;
        
        const canvasStartY = Math.round(startY * canvasScale);
        const canvasSliceHeight = Math.round(sliceHeight * canvasScale);
        const canvasWidth = fullCanvas.width;
        
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = canvasSliceHeight;
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            fullCanvas,
            0, canvasStartY,
            canvasWidth, canvasSliceHeight,
            0, 0,
            canvasWidth, canvasSliceHeight
          );
        }

        const imgHeightMM = (pageCanvas.height / pageCanvas.width) * contentWidthMM;
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, Math.min(imgHeightMM, contentHeightMM));

        console.log(`✅ [ContractPDFExporter v3.0] Página ${pageIndex + 1} renderizada`);
      }

      // Limpar
      document.body.removeChild(tempContainer);
      pdf.save(filename);
      
      console.log('✅ [ContractPDFExporter v3.0] PDF exportado com sucesso!');
    } catch (error) {
      console.error('❌ [ContractPDFExporter v3.0] Erro ao gerar PDF:', error);
      throw error;
    }
  }

  /**
   * Gera PDF do elemento HTML e retorna como base64
   * Usado para enviar ao ClickSign
   * 
   * VERSÃO 3.0: Canvas único com pontos de quebra seguros
   */
  static async generateBase64FromElement(element: HTMLElement): Promise<string> {
    try {
      console.log('📄 [ContractPDFExporter v3.0] Gerando PDF base64...');
      
      const pageWidthMM = 210;
      const pageHeightMM = 297;
      const marginMM = 12;
      const contentWidthMM = pageWidthMM - (marginMM * 2);
      const contentHeightMM = pageHeightMM - (marginMM * 2);
      
      // Criar container temporário
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 794px;
        background: white;
        padding: 40px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1a1a1a;
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { word-break: break-word; overflow-wrap: break-word; }
        p, .info-value { word-break: break-word; overflow-wrap: break-word; }
      `;
      tempContainer.appendChild(style);
      
      const contentClone = element.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(contentClone);
      document.body.appendChild(tempContainer);

      await new Promise(r => setTimeout(r, 100));

      // Capturar canvas completo
      const fullCanvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794
      });

      // Identificar pontos de quebra
      const breakableElements = tempContainer.querySelectorAll(
        'tr, p, .section, .clause, .info-row, .signature-section, .witnesses-section, h2, h3, .section-title'
      );
      
      const containerRect = tempContainer.getBoundingClientRect();
      const elementBottoms: number[] = [];
      
      breakableElements.forEach(el => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        elementBottoms.push(rect.bottom - containerRect.top);
      });
      
      const sortedBreaks = [...new Set(elementBottoms)].sort((a, b) => a - b);

      const canvasScale = 2;
      const domWidthPx = 794;
      const pxPerMM = domWidthPx / contentWidthMM;
      const maxDomHeightPerPage = contentHeightMM * pxPerMM;

      const pageBreaks: number[] = [0];
      let lastBreak = 0;
      
      for (const breakPoint of sortedBreaks) {
        if (breakPoint - lastBreak > maxDomHeightPerPage) {
          const previousSafe = sortedBreaks
            .filter(bp => bp > lastBreak && bp <= lastBreak + maxDomHeightPerPage)
            .pop();
          
          if (previousSafe && previousSafe !== lastBreak) {
            pageBreaks.push(previousSafe);
            lastBreak = previousSafe;
          } else {
            pageBreaks.push(lastBreak + maxDomHeightPerPage);
            lastBreak = lastBreak + maxDomHeightPerPage;
          }
        }
      }
      
      const totalDomHeight = tempContainer.scrollHeight;
      if (pageBreaks[pageBreaks.length - 1] < totalDomHeight) {
        pageBreaks.push(totalDomHeight);
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      for (let pageIndex = 0; pageIndex < pageBreaks.length - 1; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const startY = pageBreaks[pageIndex];
        const endY = pageBreaks[pageIndex + 1];
        const sliceHeight = endY - startY;
        
        const canvasStartY = Math.round(startY * canvasScale);
        const canvasSliceHeight = Math.round(sliceHeight * canvasScale);
        const canvasWidth = fullCanvas.width;
        
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = canvasSliceHeight;
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            fullCanvas,
            0, canvasStartY,
            canvasWidth, canvasSliceHeight,
            0, 0,
            canvasWidth, canvasSliceHeight
          );
        }

        const imgHeightMM = (pageCanvas.height / pageCanvas.width) * contentWidthMM;
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, Math.min(imgHeightMM, contentHeightMM));
      }

      document.body.removeChild(tempContainer);

      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const sizeKB = Math.round(pdfBase64.length * 0.75 / 1024);
      console.log(`✅ [ContractPDFExporter v3.0] PDF gerado: ${pageBreaks.length - 1} páginas, ~${sizeKB}KB`);
      
      return pdfBase64;
    } catch (error) {
      console.error('❌ [ContractPDFExporter v3.0] Erro ao gerar PDF:', error);
      throw error;
    }
  }

  /**
   * Gera PDF a partir dos dados do contrato (método legado)
   * Usado quando não há elemento HTML disponível
   */
  static async exportFromData(contract: ContractData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    const colors = {
      exaRed: { r: 139, g: 26, b: 26 },
      darkGray: { r: 31, g: 41, b: 55 },
      mediumGray: { r: 107, g: 114, b: 128 },
      lightGray: { r: 243, g: 244, b: 246 },
      white: { r: 255, g: 255, b: 255 },
    };

    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatDate = (dateString: string): string => {
      return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Header com gradiente EXA
    doc.setFillColor(colors.exaRed.r, colors.exaRed.g, colors.exaRed.b);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Logo e título
    doc.setTextColor(colors.white.r, colors.white.g, colors.white.b);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EXA MÍDIA', margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Soluções Digitais em Elevadores', margin, 26);

    // Número do contrato
    doc.setFontSize(9);
    doc.text(`Contrato: ${contract.numero_contrato}`, pageWidth - margin, 18, { align: 'right' });
    doc.text(`Emitido: ${formatDate(contract.created_at)}`, pageWidth - margin, 26, { align: 'right' });

    yPos = 50;

    // Título do contrato
    doc.setTextColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE PUBLICIDADE EM MÍDIA DIGITAL', pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;

    // Seção CONTRATANTE
    doc.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'F');

    doc.setTextColor(colors.exaRed.r, colors.exaRed.g, colors.exaRed.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATANTE', margin + 5, yPos + 8);

    doc.setTextColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome/Razão Social: ${contract.cliente_razao_social || contract.cliente_nome}`, margin + 5, yPos + 16);
    doc.text(`CNPJ: ${contract.cliente_cnpj || 'Não informado'}`, margin + 5, yPos + 22);
    doc.text(`E-mail: ${contract.cliente_email}`, margin + 5, yPos + 28);

    yPos += 40;

    // Valores
    doc.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');

    doc.setTextColor(colors.exaRed.r, colors.exaRed.g, colors.exaRed.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('VALORES', margin + 5, yPos + 8);

    doc.setTextColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const valorMensal = contract.valor_mensal || 0;
    const valorTotal = contract.valor_total || 0;
    doc.text(`Valor Mensal: ${formatCurrency(valorMensal)}`, margin + 5, yPos + 16);
    doc.text(`Valor Total: ${formatCurrency(valorTotal)}`, margin + 5, yPos + 22);

    yPos += 35;

    // Período
    doc.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');

    doc.setTextColor(colors.exaRed.r, colors.exaRed.g, colors.exaRed.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PERÍODO', margin + 5, yPos + 8);

    doc.setTextColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dataInicio = contract.data_inicio ? formatDate(contract.data_inicio) : 'A definir';
    const dataFim = contract.data_fim ? formatDate(contract.data_fim) : 'A definir';
    doc.text(`De ${dataInicio} a ${dataFim} (${contract.plano_meses || 0} meses)`, margin + 5, yPos + 16);

    yPos += 30;

    // Prédios
    const predios = contract.lista_predios || [];
    if (predios.length > 0) {
      doc.setTextColor(colors.exaRed.r, colors.exaRed.g, colors.exaRed.b);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('LOCAIS CONTRATADOS', margin, yPos);
      yPos += 8;

      doc.setTextColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      predios.forEach((predio: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${predio.building_name || predio.nome || 'Prédio'}`, margin + 5, yPos);
        yPos += 5;
      });
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(colors.mediumGray.r, colors.mediumGray.g, colors.mediumGray.b);
      doc.text(
        `Página ${i} de ${pageCount} | EXA Mídia - Contrato ${contract.numero_contrato}`,
        pageWidth / 2,
        290,
        { align: 'center' }
      );
    }

    doc.save(`contrato-${contract.numero_contrato}.pdf`);
  }
}
