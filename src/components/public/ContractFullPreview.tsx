import React, { useRef, useMemo, useState } from 'react';
import { X, FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
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

  /**
   * ALGORITMO V3.0 - Canvas Único com Pontos de Quebra Seguros
   * 
   * Em vez de agrupar seções (que pode comprimir seções grandes),
   * renderizamos TODO o conteúdo em um único canvas e depois
   * identificamos pontos seguros para corte (entre linhas de tabela, parágrafos, etc.)
   */
  const handleDownloadPDF = async () => {
    if (!contractRef.current) return;
    setIsDownloading(true);

    try {
      console.log('📄 [ContractPDF v3.0] Iniciando geração com pontos de quebra seguros...');
      
      // Criar container temporário para renderização
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
      
      // Adicionar estilos e conteúdo (CSS com word-break para evitar truncamento)
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
            word-break: break-word;
            overflow-wrap: break-word;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 10pt;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
            word-break: break-word;
            overflow-wrap: break-word;
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
            flex-shrink: 0;
            max-width: 40%;
          }
          .info-value {
            font-weight: 500;
            color: #1a1a1a;
            text-align: right;
            font-size: 10pt;
            word-break: break-word;
            overflow-wrap: break-word;
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

      // Forçar reflow
      await new Promise(r => setTimeout(r, 100));

      // ======= CAPTURAR CANVAS COMPLETO =======
      console.log('📸 [ContractPDF v3.0] Capturando canvas completo...');
      
      const fullCanvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        width: 794
      });

      console.log(`📐 [ContractPDF v3.0] Canvas total: ${fullCanvas.width}x${fullCanvas.height}px`);

      // ======= IDENTIFICAR PONTOS DE QUEBRA SEGUROS =======
      // Elementos que podem servir de "fronteira" para quebra de página
      const breakableElements = tempContainer.querySelectorAll(
        'tr, p, .section, .clause, .info-row, .signature-section, .witnesses-section, h2, h3, .section-title'
      );
      
      const containerRect = tempContainer.getBoundingClientRect();
      
      // Coletar posições Y de todos os elementos quebráveis
      const elementBottoms: number[] = [];
      breakableElements.forEach(el => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        // Usar rect.top para cortar ANTES do elemento, eliminando linha fantasma
        const relativeTop = rect.top - containerRect.top;
        if (relativeTop > 0) {
          elementBottoms.push(relativeTop);
        }
      });
      
      // Ordenar e remover duplicados
      const sortedBreaks = [...new Set(elementBottoms)].sort((a, b) => a - b);
      console.log(`📍 [ContractPDF v3.0] ${sortedBreaks.length} pontos de quebra identificados`);

      // ======= CONFIGURAÇÕES DO PDF A4 =======
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
      
      // O canvas foi renderizado com scale: 2, então as dimensões reais são 2x
      const canvasScale = 2;
      const domWidthPx = 794; // Largura do DOM
      
      // Altura máxima do DOM por página (antes do scale)
      const pxPerMM = domWidthPx / contentWidthMM;
      const maxDomHeightPerPage = contentHeightMM * pxPerMM; // ~1165px do DOM
      
      console.log(`📏 [ContractPDF v3.0] Altura máxima DOM por página: ${Math.round(maxDomHeightPerPage)}px`);

      // ======= DIVIDIR EM PÁGINAS USANDO PONTOS SEGUROS =======
      const pageBreaks: number[] = [0]; // Começa em 0
      let lastBreak = 0;
      
      for (const breakPoint of sortedBreaks) {
        // Se este ponto ultrapassa a altura máxima desde o último break
        if (breakPoint - lastBreak > maxDomHeightPerPage) {
          // Voltar para o último ponto seguro que ainda cabia
          const previousSafe = sortedBreaks
            .filter(bp => bp > lastBreak && bp <= lastBreak + maxDomHeightPerPage)
            .pop();
          
          if (previousSafe && previousSafe !== lastBreak) {
            pageBreaks.push(previousSafe);
            lastBreak = previousSafe;
          } else {
            // Se não encontrou ponto seguro, forçar quebra na altura máxima
            pageBreaks.push(lastBreak + maxDomHeightPerPage);
            lastBreak = lastBreak + maxDomHeightPerPage;
          }
        }
      }
      
      // Adicionar fim do documento
      const totalDomHeight = tempContainer.scrollHeight;
      if (pageBreaks[pageBreaks.length - 1] < totalDomHeight) {
        pageBreaks.push(totalDomHeight);
      }

      console.log(`📄 [ContractPDF v3.0] ${pageBreaks.length - 1} páginas calculadas`);
      pageBreaks.forEach((bp, i) => {
        if (i > 0) {
          console.log(`  Página ${i}: DOM ${Math.round(pageBreaks[i-1])}px → ${Math.round(bp)}px (${Math.round(bp - pageBreaks[i-1])}px)`);
        }
      });

      // ======= RENDERIZAR CADA PÁGINA =======
      for (let pageIndex = 0; pageIndex < pageBreaks.length - 1; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const startY = pageBreaks[pageIndex];
        const endY = pageBreaks[pageIndex + 1];
        const sliceHeight = endY - startY;
        
        // Converter para coordenadas do canvas (com scale)
        const canvasStartY = Math.round(startY * canvasScale);
        const canvasSliceHeight = Math.round(sliceHeight * canvasScale);
        const canvasWidth = fullCanvas.width;
        
        // Criar canvas para esta fatia
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = canvasSliceHeight;
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          // Copiar a fatia do canvas principal
          ctx.drawImage(
            fullCanvas,
            0, canvasStartY,                    // Source X, Y
            canvasWidth, canvasSliceHeight,     // Source width, height
            0, 0,                               // Dest X, Y
            canvasWidth, canvasSliceHeight      // Dest width, height
          );
        }

        // Calcular altura proporcional em mm
        const imgHeightMM = (pageCanvas.height / pageCanvas.width) * contentWidthMM;

        // Adicionar ao PDF
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, Math.min(imgHeightMM, contentHeightMM));

        console.log(`✅ [ContractPDF v3.0] Página ${pageIndex + 1} renderizada (${Math.round(sliceHeight)}px → ${Math.round(imgHeightMM)}mm)`);
      }

      // Limpar container
      document.body.removeChild(tempContainer);

      // Download do PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`contrato-exa-midia-${timestamp}.pdf`);

      console.log('✅ [ContractPDF v3.0] PDF gerado com sucesso!');

    } catch (error) {
      console.error('❌ [ContractPDF v3.0] Erro ao gerar PDF:', error);
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
          </div>
        </div>
      </div>
    </div>
  );
};
