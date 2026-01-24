import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Settings,
  Save,
  Loader2,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { LegalHealthGauge } from './LegalHealthGauge';
import { HealthBreakdown } from '@/hooks/useLegalFlow';
import { exportContractToPDF } from './ContractPDFExporter';
import { toast } from 'sonner';

// Logo oficial EXA
const EXA_LOGO_URL = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Exa%20sozinha.png";

interface WorkspaceHeaderProps {
  health: {
    score: number;
    breakdown: HealthBreakdown;
  };
  isSaving?: boolean;
  onSave?: () => void;
  contractType?: string;
  contractNumber?: string;
}

export function WorkspaceHeader({ 
  health, 
  isSaving,
  onSave,
  contractType,
  contractNumber
}: WorkspaceHeaderProps) {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const filename = contractNumber 
        ? `contrato-${contractNumber}` 
        : `contrato-${new Date().toISOString().split('T')[0]}`;
      await exportContractToPDF('contract-preview', filename);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      'anunciante': 'Anunciante',
      'comodato': 'Comodato',
      'permuta': 'Permuta',
      'parceria_pj': 'Parceria PJ',
      'parceria_clt': 'Parceria CLT',
      'termo_aceite': 'Termo de Aceite',
    };
    return type ? labels[type] || type : null;
  };

  return (
    <div className="flex-shrink-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(buildPath('juridico'))}
            className="h-9 w-9 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA Mídia" 
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Juridical Workspace
              </h1>
              <p className="text-xs text-gray-500">
                Criação assistida por IA
              </p>
            </div>
          </div>

          {contractType && (
            <Badge 
              variant="secondary" 
              className="ml-2 bg-purple-100 text-purple-700 border-purple-200"
            >
              {getTypeLabel(contractType)}
            </Badge>
          )}
        </div>

        {/* Center - Health Gauge */}
        <div className="hidden md:flex items-center gap-4">
          <LegalHealthGauge 
            score={health.score} 
            breakdown={health.breakdown}
            variant="compact"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile health indicator */}
          <div className="md:hidden">
            <div className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              ${health.score >= 85 
                ? 'bg-green-100 text-green-700' 
                : health.score >= 50 
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }
            `}>
              <span>{health.score}%</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="hidden sm:flex"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Rascunho
          </Button>

          <Button
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-[#8B1A1A] hover:bg-[#6B1515] text-white"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Baixar PDF
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-gray-500"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div 
          className={`
            h-full transition-all duration-500 ease-out
            ${health.score >= 85 
              ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
              : health.score >= 50 
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-red-400 to-rose-500'
            }
          `}
          style={{ width: `${health.score}%` }}
        />
      </div>
    </div>
  );
}
