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
   * Usa método de RECORTE (crop) para evitar duplicação
   */
  static async exportFromElement(element: HTMLElement, filename: string): Promise<void> {
    try {
      // Configurações para alta qualidade
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // Dimensões A4 em mm
      const a4WidthMM = 210;
      const a4HeightMM = 297;
      const marginMM = 10;
      const contentWidthMM = a4WidthMM - (marginMM * 2);
      const contentHeightMM = a4HeightMM - (marginMM * 2);

      // Calcular escala
      const pxPerMM = canvas.width / contentWidthMM;
      const pageHeightPx = contentHeightMM * pxPerMM;
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Recortar cada página separadamente
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        const srcY = page * pageHeightPx;
        const srcHeight = Math.min(pageHeightPx, canvas.height - srcY);

        // Canvas temporário para este pedaço
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = srcHeight;
        
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, srcY, canvas.width, srcHeight,
            0, 0, canvas.width, srcHeight
          );
        }

        const pageImgData = tempCanvas.toDataURL('image/jpeg', 0.92);
        const destHeightMM = srcHeight / pxPerMM;

        pdf.addImage(pageImgData, 'JPEG', marginMM, marginMM, contentWidthMM, destHeightMM);
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }

  /**
   * Gera PDF do elemento HTML e retorna como base64
   * Usado para enviar ao ClickSign
   * 
   * IMPORTANTE: Este método RECORTA (crop) cada página do canvas
   * em vez de usar yOffset, evitando duplicação de conteúdo
   */
  static async generateBase64FromElement(element: HTMLElement): Promise<string> {
    try {
      console.log('📄 [ContractPDFExporter] Gerando PDF do elemento...');
      
      // Configurações para alta qualidade
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      console.log(`📏 Canvas capturado: ${canvas.width}x${canvas.height}px`);
      
      // Dimensões A4 em mm
      const a4WidthMM = 210;
      const a4HeightMM = 297;
      const marginMM = 10;
      const contentWidthMM = a4WidthMM - (marginMM * 2); // 190mm
      const contentHeightMM = a4HeightMM - (marginMM * 2); // 277mm

      // Calcular escala: pixels do canvas → mm do PDF
      const pxPerMM = canvas.width / contentWidthMM;
      const pageHeightPx = contentHeightMM * pxPerMM;

      // Calcular total de páginas necessárias
      const totalPages = Math.ceil(canvas.height / pageHeightPx);
      console.log(`📄 Total de páginas: ${totalPages}`);

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Para CADA página, recortar o pedaço correspondente do canvas
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        // Calcular área a recortar do canvas original
        const srcY = page * pageHeightPx;
        const srcHeight = Math.min(pageHeightPx, canvas.height - srcY);

        // Criar canvas temporário com APENAS esta parte da página
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = srcHeight;
        
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          // Recortar a parte correspondente do canvas original
          ctx.drawImage(
            canvas,
            0, srcY,                    // Source X, Y (de onde copiar)
            canvas.width, srcHeight,    // Source width, height (tamanho a copiar)
            0, 0,                       // Dest X, Y (onde colar)
            canvas.width, srcHeight     // Dest width, height (tamanho do destino)
          );
        }

        // Converter este pedaço para imagem JPEG (menor que PNG)
        const pageImgData = tempCanvas.toDataURL('image/jpeg', 0.92);

        // Calcular altura em mm para esta página
        const destHeightMM = srcHeight / pxPerMM;

        // Adicionar ao PDF - cada página recebe SÓ seu pedaço
        pdf.addImage(
          pageImgData, 
          'JPEG', 
          marginMM,           // X position
          marginMM,           // Y position (sempre no topo da página)
          contentWidthMM,     // Width
          destHeightMM        // Height (proporcional ao conteúdo)
        );

        console.log(`✅ Página ${page + 1}/${totalPages} adicionada`);
      }

      // Retornar como base64 (sem o prefixo data:)
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const sizeKB = Math.round(pdfBase64.length * 0.75 / 1024);
      console.log(`✅ [ContractPDFExporter] PDF gerado: ${totalPages} páginas, ~${sizeKB}KB`);
      
      return pdfBase64;
    } catch (error) {
      console.error('❌ [ContractPDFExporter] Erro ao gerar PDF base64:', error);
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
        `Página ${i} de ${pageCount} | EXA Mídia - CNPJ: 62.878.193/0001-35`,
        pageWidth / 2,
        290,
        { align: 'center' }
      );
    }

    doc.save(`Contrato_${contract.numero_contrato}.pdf`);
  }
}

export default ContractPDFExporter;
