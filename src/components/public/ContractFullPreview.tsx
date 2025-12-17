import React, { useState, useRef } from 'react';
import { X, FileText, Check, Printer, Download, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ContractFullPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  contractHtml: string;
}

export const ContractFullPreview: React.FC<ContractFullPreviewProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  contractHtml
}) => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !contractHtml) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contrato EXA Mídia</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #1a1a1a;
              background: white;
              margin: 0;
              padding: 0;
            }
            h1, h2, h3 {
              page-break-after: avoid;
            }
            table, p {
              page-break-inside: avoid;
            }
            .clausula {
              page-break-inside: avoid;
              margin-bottom: 16px;
            }
            .assinaturas {
              page-break-inside: avoid;
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          ${contractHtml}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
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
                <h2 className="text-lg font-bold">Contrato de Prestação de Serviços</h2>
                <p className="text-sm text-white/80">Leia o contrato completo antes de aceitar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                title="Imprimir contrato"
              >
                <Printer className="h-5 w-5" />
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

        {/* Contract Content - Scrollable */}
        <div 
          ref={contractRef}
          className="flex-1 overflow-y-auto bg-gray-50"
        >
          <div className="max-w-3xl mx-auto p-3 md:p-6 lg:p-8">
            {/* Paper effect */}
            <div 
              className="bg-white rounded-lg shadow-lg p-3 md:p-6 lg:p-10 border border-gray-200"
              style={{
                minHeight: '100%',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              }}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: contractHtml }}
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

        {/* Footer - Fixed */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex-shrink-0 space-y-4">
          {/* Accept Terms Checkbox */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Checkbox
              id="accept-contract-terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="mt-0.5 border-amber-400 data-[state=checked]:bg-[#9C1E1E] data-[state=checked]:border-[#9C1E1E]"
            />
            <label htmlFor="accept-contract-terms" className="text-sm text-amber-900 cursor-pointer">
              <strong>Li e concordo</strong> com todas as cláusulas deste contrato. Entendo que após o pagamento, 
              receberei o <strong>link de assinatura digital</strong> por e-mail via ClickSign.
            </label>
          </div>

          {/* Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Contrato com validade jurídica. Assinatura digital via ClickSign após pagamento.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-gray-300"
            >
              Voltar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!acceptTerms || isLoading}
              className="flex-1 h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white font-medium shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Aceitar Contrato
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom CSS for contract HTML - Responsivo Mobile */}
      <style>{`
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
        
        /* RESPONSIVO MOBILE */
        @media (max-width: 768px) {
          .contract-content {
            font-size: 9pt !important;
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
