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
   * Captura o elemento HTML do preview e converte para PDF
   * Isso garante que o PDF seja IDÊNTICO ao que é mostrado na tela
   * 
   * VERSÃO 2.0: Paginação inteligente por seções DOM
   * Nunca corta frases, tabelas ou cláusulas no meio
   */
  static async exportFromElement(element: HTMLElement, filename: string): Promise<void> {
    try {
      console.log('📄 [ContractPDFExporter] Iniciando exportação com paginação inteligente...');
      
      // Identificar todas as seções do contrato
      const sections = element.querySelectorAll('.section, .signature-section, .witnesses-section, .contract-title, .header-container, .footer');
      
      console.log(`📋 [ContractPDFExporter] ${sections.length} seções identificadas`);

      // Se não encontrar seções marcadas, usar método de fallback com recorte melhorado
      if (sections.length === 0) {
        console.log('⚠️ [ContractPDFExporter] Nenhuma seção encontrada, usando método de fallback');
        return this.exportWithSmartCrop(element, filename);
      }

      const sectionsArray = Array.from(sections);

      // Dimensões A4 em mm
      const pageWidthMM = 210;
      const pageHeightMM = 297;
      const marginMM = 12;
      const contentWidthMM = pageWidthMM - (marginMM * 2); // 186mm
      const contentHeightMM = pageHeightMM - (marginMM * 2); // 273mm
      
      // Escala aproximada: elemento renderizado a 794px de largura
      const renderWidth = 794;
      const pxPerMM = renderWidth / contentWidthMM;
      const maxPageHeightPx = contentHeightMM * pxPerMM; // ~1165px por página

      console.log(`📏 [ContractPDFExporter] Altura máxima por página: ${Math.round(maxPageHeightPx)}px`);

      // Agrupar seções em páginas lógicas
      const pages: Element[][] = [];
      let currentPage: Element[] = [];
      let currentHeightPx = 0;

      for (let i = 0; i < sectionsArray.length; i++) {
        const section = sectionsArray[i] as HTMLElement;
        const sectionRect = section.getBoundingClientRect();
        const sectionHeightPx = sectionRect.height;

        // Se adicionar esta seção ultrapassar a altura da página
        if (currentHeightPx + sectionHeightPx > maxPageHeightPx && currentPage.length > 0) {
          console.log(`📄 [ContractPDFExporter] Página ${pages.length + 1} fechada com ${currentPage.length} seções`);
          pages.push([...currentPage]);
          currentPage = [];
          currentHeightPx = 0;
        }

        currentPage.push(section);
        currentHeightPx += sectionHeightPx;
      }

      // Última página
      if (currentPage.length > 0) {
        pages.push(currentPage);
      }

      console.log(`📊 [ContractPDFExporter] Total: ${pages.length} páginas geradas`);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Renderizar cada página
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Criar container temporário para esta página
        const pageContainer = document.createElement('div');
        pageContainer.style.cssText = `
          width: ${renderWidth}px;
          background: white;
          padding: 40px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1a1a1a;
          position: fixed;
          left: -9999px;
          top: 0;
        `;

        // Copiar as seções desta página
        pages[pageIndex].forEach(section => {
          const clone = section.cloneNode(true) as HTMLElement;
          clone.style.marginBottom = '16px';
          pageContainer.appendChild(clone);
        });

        document.body.appendChild(pageContainer);

        // Capturar com html2canvas
        const canvas = await html2canvas(pageContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: renderWidth,
        });

        document.body.removeChild(pageContainer);

        // Calcular altura proporcional em mm
        const imgHeightMM = (canvas.height / canvas.width) * contentWidthMM;

        // Adicionar ao PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, Math.min(imgHeightMM, contentHeightMM));

        console.log(`✅ [ContractPDFExporter] Página ${pageIndex + 1}/${pages.length} renderizada`);
      }

      pdf.save(filename);
      console.log('✅ [ContractPDFExporter] PDF exportado com sucesso!');
    } catch (error) {
      console.error('❌ [ContractPDFExporter] Erro ao gerar PDF:', error);
      throw error;
    }
  }

  /**
   * Método de fallback com recorte inteligente
   * Usado quando não há seções marcadas no HTML
   */
  static async exportWithSmartCrop(element: HTMLElement, filename: string): Promise<void> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const a4WidthMM = 210;
    const a4HeightMM = 297;
    const marginMM = 12;
    const contentWidthMM = a4WidthMM - (marginMM * 2);
    const contentHeightMM = a4HeightMM - (marginMM * 2);

    const pxPerMM = canvas.width / contentWidthMM;
    const pageHeightPx = contentHeightMM * pxPerMM;
    const totalPages = Math.ceil(canvas.height / pageHeightPx);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      const srcY = page * pageHeightPx;
      const srcHeight = Math.min(pageHeightPx, canvas.height - srcY);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = srcHeight;
      
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
      }

      const pageImgData = tempCanvas.toDataURL('image/jpeg', 0.92);
      const destHeightMM = srcHeight / pxPerMM;
      pdf.addImage(pageImgData, 'JPEG', marginMM, marginMM, contentWidthMM, destHeightMM);
    }

    pdf.save(filename);
  }

  /**
   * Gera PDF do elemento HTML e retorna como base64
   * Usado para enviar ao ClickSign
   * 
   * VERSÃO 2.0: Paginação inteligente por seções DOM
   * Identifica seções com .section, .signature-section, etc.
   * Garante que nenhuma seção seja cortada no meio
   */
  static async generateBase64FromElement(element: HTMLElement): Promise<string> {
    try {
      console.log('📄 [ContractPDFExporter] Gerando PDF base64 com paginação inteligente...');
      
      // Dimensões A4 em mm
      const a4WidthMM = 210;
      const a4HeightMM = 297;
      const marginMM = 12;
      const contentWidthMM = a4WidthMM - (marginMM * 2); // 186mm
      const contentHeightMM = a4HeightMM - (marginMM * 2); // 273mm

      // Identificar todas as seções do contrato (mesmos seletores do HTML gerado)
      const sections = element.querySelectorAll('.section, .signature-section, .witnesses-section, .contract-title, .header-container, .footer, .contract-section');
      console.log(`📋 [ContractPDFExporter] ${sections.length} seções identificadas`);

      // Se não encontrar seções marcadas, usar método de recorte melhorado
      if (sections.length === 0) {
        console.log('⚠️ [ContractPDFExporter] Nenhuma seção encontrada, usando método de fallback');
        return this.generateBase64WithCrop(element);
      }

      const sectionsArray = Array.from(sections);

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Escala para conversão px -> mm
      const renderWidthPx = 794;
      const pxPerMM = renderWidthPx / contentWidthMM;
      const maxPageHeightPx = contentHeightMM * pxPerMM; // ~1165px

      console.log(`📏 [ContractPDFExporter] Altura máxima por página: ${Math.round(maxPageHeightPx)}px`);

      // Agrupar seções em páginas lógicas
      const pages: Element[][] = [];
      let currentPage: Element[] = [];
      let currentHeightPx = 0;

      for (let i = 0; i < sectionsArray.length; i++) {
        const section = sectionsArray[i] as HTMLElement;
        const rect = section.getBoundingClientRect();
        const sectionHeightPx = rect.height;

        // Se adicionar esta seção ultrapassar a altura da página
        if (currentHeightPx + sectionHeightPx > maxPageHeightPx && currentPage.length > 0) {
          console.log(`📄 [ContractPDFExporter] Página ${pages.length + 1} fechada com ${currentPage.length} seções`);
          pages.push([...currentPage]);
          currentPage = [];
          currentHeightPx = 0;
        }

        currentPage.push(section);
        currentHeightPx += sectionHeightPx;
      }
      
      // Adicionar última página
      if (currentPage.length > 0) {
        pages.push(currentPage);
      }

      console.log(`📊 [ContractPDFExporter] Total: ${pages.length} páginas geradas`);

      // Renderizar cada página
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Criar container temporário para esta página
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
          width: ${renderWidthPx}px;
          background: white;
          padding: 40px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1a1a1a;
          position: fixed;
          left: -9999px;
          top: 0;
        `;

        // Copiar as seções desta página
        pages[pageIndex].forEach(section => {
          const clone = section.cloneNode(true) as HTMLElement;
          clone.style.marginBottom = '16px';
          tempContainer.appendChild(clone);
        });

        document.body.appendChild(tempContainer);

        // Capturar esta página
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: renderWidthPx,
        });

        // Limpar
        document.body.removeChild(tempContainer);

        // Calcular altura proporcional em mm
        const imgHeightMM = (canvas.height / canvas.width) * contentWidthMM;

        // Adicionar ao PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, Math.min(imgHeightMM, contentHeightMM));

        console.log(`✅ [ContractPDFExporter] Página ${pageIndex + 1}/${pages.length} renderizada`);
      }

      // Retornar como base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const sizeKB = Math.round(pdfBase64.length * 0.75 / 1024);
      console.log(`✅ [ContractPDFExporter] PDF gerado: ${pages.length} páginas, ~${sizeKB}KB`);
      
      return pdfBase64;
    } catch (error) {
      console.error('❌ [ContractPDFExporter] Erro ao gerar PDF:', error);
      throw error;
    }
  }

  /**
   * Método de fallback com recorte simples (quando não há seções marcadas)
   */
  static async generateBase64WithCrop(element: HTMLElement): Promise<string> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const a4WidthMM = 210;
    const a4HeightMM = 297;
    const marginMM = 10;
    const contentWidthMM = a4WidthMM - (marginMM * 2);
    const contentHeightMM = a4HeightMM - (marginMM * 2);

    const pxPerMM = canvas.width / contentWidthMM;
    const pageHeightPx = contentHeightMM * pxPerMM;
    const totalPages = Math.ceil(canvas.height / pageHeightPx);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      const srcY = page * pageHeightPx;
      const srcHeight = Math.min(pageHeightPx, canvas.height - srcY);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = srcHeight;
      
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
      }

      const pageImgData = tempCanvas.toDataURL('image/jpeg', 0.92);
      const destHeightMM = srcHeight / pxPerMM;
      pdf.addImage(pageImgData, 'JPEG', marginMM, marginMM, contentWidthMM, destHeightMM);
    }

    return pdf.output('datauristring').split(',')[1];
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
    doc.text(`Valor Mensal: ${formatCurrency(contract.valor_mensal || 0)}`, margin + 5, yPos + 16);
    doc.text(`Valor Total: ${formatCurrency(contract.valor_total || 0)}`, margin + 80, yPos + 16);
    doc.text(`Duração: ${contract.plano_meses || 1} meses`, margin + 5, yPos + 22);

    yPos += 35;

    // Prédios
    const predios = contract.lista_predios || [];
    if (predios.length > 0) {
      doc.setTextColor(colors.exaRed.r, colors.exaRed.g, colors.exaRed.b);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`LOCAIS CONTRATADOS (${predios.length} prédios)`, margin, yPos);

      yPos += 8;

      // Header da tabela
      doc.setFillColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
      doc.rect(margin, yPos, contentWidth, 7, 'F');
      doc.setTextColor(colors.white.r, colors.white.g, colors.white.b);
      doc.setFontSize(8);
      doc.text('PRÉDIO', margin + 3, yPos + 5);
      doc.text('BAIRRO', margin + 80, yPos + 5);
      doc.text('TELAS', margin + 140, yPos + 5);

      yPos += 9;

      // Linhas da tabela
      predios.forEach((predio: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
          doc.rect(margin, yPos, contentWidth, 6, 'F');
        }

        doc.setTextColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
        doc.setFontSize(8);
        const nome = (predio.building_name || predio.nome || '').substring(0, 35);
        const bairro = (predio.bairro || '').substring(0, 20);
        doc.text(nome, margin + 3, yPos + 4);
        doc.text(bairro, margin + 80, yPos + 4);
        doc.text(String(predio.quantidade_telas || 1), margin + 140, yPos + 4);

        yPos += 6;
      });
    }

    yPos += 10;

    // Cláusulas resumidas
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(colors.exaRed.r, colors.exaRed.g, colors.exaRed.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULAS PRINCIPAIS', margin, yPos);

    yPos += 8;

    const clauses = [
      '1. DO OBJETO: Veiculação de publicidade em painéis digitais EXA.',
      '2. VIGÊNCIA: Conforme período contratado.',
      '3. PAGAMENTO: Conforme condições acordadas.',
      '4. OBRIGAÇÕES: EXA garante exibição conforme contratado.',
      '5. RESCISÃO: Mediante aviso prévio de 30 dias.',
    ];

    doc.setTextColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    clauses.forEach((clause) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(clause, margin, yPos);
      yPos += 6;
    });

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(colors.mediumGray.r, colors.mediumGray.g, colors.mediumGray.b);
      doc.text(
        `Página ${i} de ${pageCount} | ExaMídia - Indexa Midia LTDA - CNPJ: 38.142.638/0001-30`,
        pageWidth / 2,
        290,
        { align: 'center' }
      );
    }

    doc.save(`Contrato_${contract.numero_contrato}.pdf`);
  }
}

export default ContractPDFExporter;
