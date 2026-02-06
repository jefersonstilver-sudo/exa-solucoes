import React, { useRef, useMemo, useState } from 'react';
import { X, FileText, Download, AlertCircle, FileWarning, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Header EXA oficial - IMAGEM LOCAL (evita problemas de bucket privado)
import exaContractHeader from '@/assets/exa-contract-header.png';

interface ContractFullPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  contractHtml: string;
}

export const ContractFullPreview: React.FC<ContractFullPreviewProps> = ({
  isOpen,
  onClose,
  contractHtml
}) => {
  const contractRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Substituir URLs quebradas do header por import local
  const processedHtml = useMemo(() => {
    if (!contractHtml) return '';
    
    // Substituir todas as variantes de URL do header quebrado pelo import local
    return contractHtml
      .replace(
        /src="https:\/\/aakenoljsycyrcrchgxj\.supabase\.co\/storage\/v1\/object\/public\/arquivos\/logo%20e%20icones\/exa-contract-header\.png"/g,
        `src="${exaContractHeader}"`
      )
      .replace(
        /src="https:\/\/aakenoljsycyrcrchgxj\.supabase\.co\/storage\/v1\/object\/public\/email-assets\/exa-contract-header\.png"/g,
        `src="${exaContractHeader}"`
      );
  }, [contractHtml]);

  if (!isOpen || !processedHtml) return null;

  const handleDownloadPDF = async () => {
    if (!contractRef.current) return;
    setIsDownloading(true);

    try {
      console.log('📄 [ContractPDF] Iniciando geração com paginação inteligente...');
      
      // Criar container temporário para renderização limpa
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 794px;
        background: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1a1a1a;
        padding: 40px;
      `;
      
      // Adicionar estilos e conteúdo
      tempContainer.innerHTML = `
        <style>
          * { box-sizing: border-box; }
          
          .header-container {
            width: 100%;
            margin-bottom: 20px;
          }
          .header-image {
            width: 100%;
            height: auto;
          }
          h1 {
            font-size: 18px;
            font-weight: 700;
            text-align: center;
            color: #1a1a1a;
            margin-bottom: 20px;
          }
          h2, h3 {
            font-size: 14px;
            font-weight: 700;
            color: #1a1a1a;
            margin-top: 24px;
            margin-bottom: 12px;
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 4px;
          }
          p {
            margin-bottom: 12px;
            text-align: justify;
            orphans: 3;
            widows: 3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 10pt;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
          }
          ul, ol {
            margin: 12px 0;
            padding-left: 24px;
          }
          li {
            margin-bottom: 8px;
          }
          
          /* Estilos específicos do contrato */
          .contract-title {
            text-align: center;
            margin: 30px 0;
          }
          .contract-title h1 {
            color: #8B1A1A;
            font-size: 16pt;
            margin: 0 0 10px 0;
          }
          .contract-number {
            font-size: 12pt;
            color: #666;
          }
          .section {
            margin: 25px 0;
          }
          .section-title {
            background: linear-gradient(90deg, #8B1A1A, #A52020);
            color: white;
            padding: 10px 15px;
            font-size: 12pt;
            font-weight: 600;
            margin-bottom: 15px;
            border-radius: 4px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
          }
          .info-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
          }
          .info-card-title {
            font-weight: 600;
            color: #8B1A1A;
            margin-bottom: 10px;
            font-size: 11pt;
            border-bottom: 2px solid #8B1A1A;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #ddd;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #666;
            font-size: 10pt;
          }
          .info-value {
            font-weight: 500;
            color: #1a1a1a;
            text-align: right;
            font-size: 10pt;
          }
          
          /* Seção de assinaturas */
          .signature-section {
            margin-top: 60px;
          }
          .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 30px;
          }
          .signature-box {
            text-align: center;
            padding-top: 10px;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 60px;
            padding-top: 10px;
          }
          .signature-name {
            font-weight: 600;
            font-size: 11pt;
            margin-bottom: 4px;
          }
          .signature-role {
            font-size: 10pt;
            color: #666;
          }
          .signature-doc {
            font-size: 9pt;
            color: #888;
          }
          
          .witnesses-section {
            margin-top: 50px;
          }
          .witnesses-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 20px;
          }
          .witness-box {
            text-align: center;
          }
          .witness-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 10px;
          }
        </style>
        ${processedHtml}
      `;
      
      document.body.appendChild(tempContainer);

      // Aguardar imagens carregarem
      const images = tempContainer.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // ======= PAGINAÇÃO INTELIGENTE POR SEÇÕES =======
      // Identificar todas as seções do contrato
      const sections = tempContainer.querySelectorAll('.section, .signature-section, .witnesses-section, .contract-title, .header-container, .footer');
      
      console.log(`📋 [ContractPDF] ${sections.length} seções identificadas para paginação`);

      // Se não encontrar seções marcadas, criar seções a partir de divs principais
      const sectionsArray: Element[] = sections.length > 0 
        ? Array.from(sections) 
        : Array.from(tempContainer.children);

      // Configurações do PDF A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidthMM = 210;
      const pageHeightMM = 297;
      const marginMM = 12;
      const contentWidthMM = pageWidthMM - (marginMM * 2); // 186mm
      const contentHeightMM = pageHeightMM - (marginMM * 2); // 273mm
      
      // Escala: 794px = 186mm de conteúdo útil
      const pxPerMM = 794 / contentWidthMM; // ~4.27 px/mm
      const maxPageHeightPx = contentHeightMM * pxPerMM; // ~1165px por página

      console.log(`📏 [ContractPDF] Altura máxima por página: ${Math.round(maxPageHeightPx)}px`);

      // Agrupar seções em páginas lógicas
      const pages: Element[][] = [];
      let currentPage: Element[] = [];
      let currentHeightPx = 0;

      for (let i = 0; i < sectionsArray.length; i++) {
        const section = sectionsArray[i] as HTMLElement;
        const sectionRect = section.getBoundingClientRect();
        const sectionHeightPx = sectionRect.height;

        // Log para auditoria
        const sectionClass = section.className || 'sem-classe';
        const sectionPreview = section.textContent?.substring(0, 50) || '';
        
        // Se adicionar esta seção ultrapassar a altura da página
        if (currentHeightPx + sectionHeightPx > maxPageHeightPx && currentPage.length > 0) {
          console.log(`📄 [ContractPDF] Página ${pages.length + 1} fechada com ${currentPage.length} seções (${Math.round(currentHeightPx)}px)`);
          pages.push([...currentPage]);
          currentPage = [];
          currentHeightPx = 0;
        }

        // Adicionar seção à página atual
        currentPage.push(section);
        currentHeightPx += sectionHeightPx;
        
        console.log(`  → Seção ${i + 1}: ${Math.round(sectionHeightPx)}px (${sectionClass.substring(0, 30)}) "${sectionPreview.substring(0, 30)}..."`);
      }

      // Última página
      if (currentPage.length > 0) {
        console.log(`📄 [ContractPDF] Página ${pages.length + 1} (última) com ${currentPage.length} seções (${Math.round(currentHeightPx)}px)`);
        pages.push(currentPage);
      }

      console.log(`📊 [ContractPDF] Total: ${pages.length} páginas geradas`);

      // Renderizar cada página
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Criar container temporário para esta página específica
        const pageContainer = document.createElement('div');
        pageContainer.style.cssText = `
          width: 794px;
          background: white;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1a1a1a;
        `;

        // Copiar as seções desta página
        pages[pageIndex].forEach(section => {
          const clone = section.cloneNode(true) as HTMLElement;
          pageContainer.appendChild(clone);
        });

        // Adicionar ao DOM temporariamente
        const renderContainer = document.createElement('div');
        renderContainer.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: 794px;
          background: white;
          padding: 40px;
        `;
        renderContainer.appendChild(pageContainer);
        document.body.appendChild(renderContainer);

        // Capturar com html2canvas
        const canvas = await html2canvas(renderContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true,
          width: 794
        });

        // Limpar
        document.body.removeChild(renderContainer);

        // Calcular altura proporcional em mm
        const imgHeightMM = (canvas.height / canvas.width) * contentWidthMM;

        // Adicionar ao PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, Math.min(imgHeightMM, contentHeightMM));

        console.log(`✅ [ContractPDF] Página ${pageIndex + 1}/${pages.length} renderizada`);
      }

      // Limpar container principal
      document.body.removeChild(tempContainer);

      // Download do PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`contrato-exa-midia-${timestamp}.pdf`);

      console.log('✅ [ContractPDF] PDF gerado com sucesso!');

    } catch (error) {
      console.error('❌ [ContractPDF] Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[98vh] md:h-[95vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#9C1E1E] to-[#B52525] px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Contrato</h2>
                </div>
                <p className="text-sm text-white/80">Visualize e baixe o contrato completo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
                title="Baixar PDF"
              >
                {isDownloading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </button>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 flex items-start gap-3">
          <Download className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">
            <p className="font-semibold mb-1">Clique no botão de download para baixar o PDF</p>
            <p className="text-emerald-700">
              O documento será gerado em formato A4, pronto para impressão e arquivo.
            </p>
          </div>
        </div>

        {/* Contract Content - Scrollable (SEM watermark) */}
        <div 
          ref={contractRef}
          className="flex-1 overflow-y-auto bg-gray-50 relative"
        >
          <div className="max-w-3xl mx-auto p-3 md:p-6 lg:p-8 relative z-20">
            {/* Paper effect */}
            <div 
              className="bg-white rounded-lg shadow-lg p-3 md:p-6 lg:p-10 border border-gray-200"
              style={{
                minHeight: '100%',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              }}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: processedHtml }}
                className="contract-content prose prose-sm max-w-none"
                style={{
                  fontSize: '11pt',
                  lineHeight: '1.6',
                  color: '#1a1a1a'
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex-shrink-0">
          {/* Info */}
          <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <AlertCircle className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Próximos passos:</strong> Aceite a proposta → Efetue o pagamento → O contrato será enviado para assinatura digital.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex-1 h-12 bg-[#9C1E1E] hover:bg-[#7a1717]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Contrato em PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 border-gray-300 px-6"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>

      {/* Custom CSS for contract HTML - Responsivo Mobile */}
      <style>{`
        /* HEADER OFICIAL - Full Width */
        .contract-content .header-container {
          width: calc(100% + 48px);
          margin: -24px -24px 20px -24px;
          display: block;
        }
        
        .contract-content .header-image {
          width: 100%;
          height: auto;
          display: block;
          max-width: none;
        }
        
        .contract-content img {
          max-width: 100%;
          height: auto;
        }
        
        .contract-content h1 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
          color: #1a1a1a;
        }
        .contract-content h2 {
          font-size: 14px;
          font-weight: 700;
          margin-top: 24px;
          margin-bottom: 12px;
          color: #1a1a1a;
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 4px;
        }
        .contract-content p {
          margin-bottom: 12px;
          text-align: justify;
        }
        .contract-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 10pt;
        }
        .contract-content table th,
        .contract-content table td {
          border: 1px solid #d1d5db;
          padding: 8px 10px;
          text-align: left;
        }
        .contract-content table th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        .contract-content .assinaturas {
          margin-top: 40px;
          display: flex;
          flex-wrap: wrap;
          gap: 40px;
          justify-content: space-between;
        }
        .contract-content .assinatura-box {
          flex: 1;
          min-width: 200px;
          text-align: center;
          padding-top: 60px;
          border-top: 1px solid #1a1a1a;
        }
        .contract-content strong {
          font-weight: 600;
        }
        .contract-content ul, .contract-content ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        .contract-content li {
          margin-bottom: 8px;
        }
        
        /* Estilos do contrato gerado pela edge function */
        .contract-content .contract-title {
          text-align: center;
          margin: 30px 0;
        }
        .contract-content .contract-title h1 {
          color: #8B1A1A;
          font-size: 16pt;
          margin: 0 0 10px 0;
          font-weight: 600;
        }
        .contract-content .contract-number {
          font-size: 12pt;
          color: #666;
        }
        .contract-content .section-title {
          background: linear-gradient(90deg, #8B1A1A, #A52020);
          color: white;
          padding: 10px 15px;
          font-size: 12pt;
          font-weight: 600;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        .contract-content .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 15px 0;
        }
        .contract-content .info-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
        }
        .contract-content .info-card-title {
          font-weight: 600;
          color: #8B1A1A;
          margin-bottom: 10px;
          font-size: 11pt;
          border-bottom: 2px solid #8B1A1A;
          padding-bottom: 5px;
        }
        .contract-content .info-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dotted #ddd;
        }
        .contract-content .info-row:last-child {
          border-bottom: none;
        }
        .contract-content .info-label {
          color: #666;
          font-size: 10pt;
        }
        .contract-content .info-value {
          font-weight: 500;
          color: #1a1a1a;
          text-align: right;
          font-size: 10pt;
        }
        
        /* Seção de assinaturas */
        .contract-content .signature-section {
          margin-top: 60px;
          page-break-inside: avoid;
        }
        .contract-content .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 30px;
        }
        .contract-content .signature-box {
          text-align: center;
          padding-top: 10px;
        }
        .contract-content .signature-line {
          border-top: 1px solid #333;
          margin-top: 60px;
          padding-top: 10px;
        }
        .contract-content .signature-name {
          font-weight: 600;
          font-size: 11pt;
          margin-bottom: 4px;
        }
        .contract-content .signature-role {
          font-size: 10pt;
          color: #666;
        }
        .contract-content .signature-doc {
          font-size: 9pt;
          color: #888;
        }
        .contract-content .witnesses-section {
          margin-top: 50px;
          page-break-inside: avoid;
        }
        .contract-content .witnesses-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 20px;
        }
        .contract-content .witness-box {
          text-align: center;
        }
        .contract-content .witness-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 10px;
        }
        
        /* RESPONSIVO MOBILE */
        @media (max-width: 768px) {
          .contract-content {
            font-size: 9pt !important;
          }
          .contract-content .header-container {
            width: calc(100% + 24px);
            margin: -12px -12px 15px -12px;
          }
          .contract-content h1 {
            font-size: 14px;
          }
          .contract-content h2 {
            font-size: 12px;
          }
          .contract-content .info-grid {
            display: block !important;
          }
          .contract-content .info-card {
            margin-bottom: 12px;
          }
          .contract-content .signatures-grid,
          .contract-content .witnesses-grid {
            display: block !important;
          }
          .contract-content .signature-box,
          .contract-content .witness-box {
            margin-bottom: 30px;
          }
          .contract-content table {
            display: block;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            font-size: 8pt;
          }
          .contract-content table th,
          .contract-content table td {
            padding: 6px 8px;
            white-space: nowrap;
            min-width: 60px;
          }
          .contract-content ul, .contract-content ol {
            padding-left: 16px;
          }
          .contract-content .section-title {
            font-size: 10pt !important;
            padding: 8px 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ContractFullPreview;
