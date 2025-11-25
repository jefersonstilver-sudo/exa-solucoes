import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Building,
  Megaphone,
  User,
  Wrench
} from 'lucide-react';
import { LeadProfile } from '../../hooks/useLeadProfile';

interface LeadAnalysisSectionProps {
  profile: LeadProfile | null;
  detectedType: string | null;
  loading?: boolean;
}

const typeIcons = {
  anunciante: <Megaphone className="w-4 h-4" />,
  sindico: <Building className="w-4 h-4" />,
  morador: <User className="w-4 h-4" />,
  suporte_tecnico: <Wrench className="w-4 h-4" />,
  cliente_ativo: <CheckCircle2 className="w-4 h-4" />
};

const typeLabels = {
  anunciante: 'Anunciante',
  sindico: 'Síndico',
  morador: 'Morador',
  suporte_tecnico: 'Suporte Técnico',
  cliente_ativo: 'Cliente Ativo'
};

const intencaoColors = {
  baixa: 'text-muted-foreground',
  media: 'text-yellow-500',
  alta: 'text-green-500'
};

const urgenciaColors = {
  baixa: 'bg-muted',
  media: 'bg-yellow-500',
  alta: 'bg-orange-500',
  critica: 'bg-red-500'
};

export const LeadAnalysisSection: React.FC<LeadAnalysisSectionProps> = ({
  profile,
  detectedType,
  loading
}) => {
  if (loading) {
    return (
      <div className="glass-card p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">Carregando análise...</p>
      </div>
    );
  }

  if (!profile && !detectedType) {
    return (
      <div className="glass-card p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Gere um relatório da IA para ver a análise completa do lead
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-lg space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        📊 Análise do Lead
      </h4>

      {/* Classificação e Intenção */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Classificação</p>
          <div className="flex items-center gap-2">
            {detectedType && typeIcons[detectedType as keyof typeof typeIcons]}
            <Badge variant="secondary">
              {detectedType ? typeLabels[detectedType as keyof typeof typeLabels] : 'Não classificado'}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              🤖 IA
            </Badge>
          </div>
        </div>

        {profile?.intencao && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Intenção</p>
            <div className={`font-semibold uppercase ${intencaoColors[profile.intencao]}`}>
              {profile.intencao}
              {profile.intencao === 'alta' && ' ●●●○'}
              {profile.intencao === 'media' && ' ●●○○'}
              {profile.intencao === 'baixa' && ' ●○○○'}
            </div>
          </div>
        )}
      </div>

      {/* Dados Extraídos para Anunciantes */}
      {detectedType === 'anunciante' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">📋 DADOS EXTRAÍDOS</p>
          <div className="space-y-1 text-sm">
            {profile?.empresa_nome && (
              <div>• Empresa: <span className="font-medium">{profile.empresa_nome}</span></div>
            )}
            {profile?.segmento && (
              <div>• Segmento: <span className="font-medium">{profile.segmento}</span></div>
            )}
            {profile?.bairro_interesse && (
              <div>• Bairro: <span className="font-medium">{profile.bairro_interesse}</span></div>
            )}
            {profile?.predios_desejados && (
              <div>• Prédios desejados: <span className="font-medium">{profile.predios_desejados}</span></div>
            )}
            {profile?.orcamento_estimado && (
              <div>• Orçamento estimado: <span className="font-medium">~R$ {profile.orcamento_estimado.toLocaleString('pt-BR')}</span></div>
            )}
            {profile?.estagio_compra && (
              <div>• Estágio: <span className="font-medium capitalize">{profile.estagio_compra}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Dados Extraídos para Síndicos */}
      {detectedType === 'sindico' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">📋 DADOS EXTRAÍDOS</p>
          <div className="space-y-1 text-sm">
            {profile?.predio_nome && (
              <div>• Prédio: <span className="font-medium">{profile.predio_nome}</span></div>
            )}
            {profile?.predio_andares && (
              <div>• Andares: <span className="font-medium">{profile.predio_andares}</span></div>
            )}
            {profile?.predio_unidades && (
              <div>• Unidades: <span className="font-medium">{profile.predio_unidades}</span></div>
            )}
            {profile?.predio_tipo && (
              <div>• Tipo: <span className="font-medium capitalize">{profile.predio_tipo}</span></div>
            )}
            {profile?.administradora && (
              <div>• Administradora: <span className="font-medium">{profile.administradora}</span></div>
            )}
            {profile?.interesse_real !== null && profile?.interesse_real !== undefined && (
              <div>• Interesse real: <span className="font-medium">{profile.interesse_real ? '✅ Sim' : '❌ Não'}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Indicadores */}
      <div className="space-y-3 pt-2 border-t border-module-border">
        <p className="text-xs text-muted-foreground font-semibold">🔥 INDICADORES</p>
        
        {/* Hot Lead */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${profile?.is_hot_lead ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">Hot Lead</span>
          </div>
          <Badge variant={profile?.is_hot_lead ? 'destructive' : 'outline'}>
            {profile?.is_hot_lead ? '✅ SIM' : '❌ Não'}
            {profile?.hot_lead_score && ` (${profile.hot_lead_score} pts)`}
          </Badge>
        </div>

        {/* Probabilidade de Fechamento */}
        {profile?.probabilidade_fechamento !== null && profile?.probabilidade_fechamento !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Probabilidade</span>
              <span className="text-muted-foreground">{profile.probabilidade_fechamento}%</span>
            </div>
            <Progress value={profile.probabilidade_fechamento} className="h-2" />
          </div>
        )}

        {/* Urgência */}
        {profile?.urgencia && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Urgência</span>
            <Badge className={urgenciaColors[profile.urgencia]}>
              {profile.urgencia.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Escalação */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Escalar para Eduardo</span>
          <Badge variant={profile?.necessita_escalacao ? 'destructive' : 'outline'}>
            {profile?.necessita_escalacao ? '✅ SIM' : '❌ Não'}
          </Badge>
        </div>
        
        {profile?.necessita_escalacao && profile?.motivo_escalacao && (
          <Alert className="mt-2">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-xs">
              {profile.motivo_escalacao}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Próximos Passos */}
      {profile?.proximos_passos && Array.isArray(profile.proximos_passos) && profile.proximos_passos.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-module-border">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            💡 PRÓXIMOS PASSOS (IA)
          </p>
          <div className="space-y-1">
            {profile.proximos_passos.map((step: string, index: number) => (
              <div key={index} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground">{index + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Objeções */}
      {profile?.objecoes_identificadas && profile.objecoes_identificadas.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-module-border">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            ⚠️ OBJEÇÕES IDENTIFICADAS
          </p>
          <div className="space-y-1">
            {profile.objecoes_identificadas.map((objecao, index) => (
              <div key={index} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span className="italic">"{objecao}"</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
