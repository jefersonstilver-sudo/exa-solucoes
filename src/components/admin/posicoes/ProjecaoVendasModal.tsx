import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  TrendingUp, 
  Building2, 
  DollarSign, 
  Calculator,
  RefreshCw,
  Info,
  FileText,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjecaoVendas } from '@/hooks/usePosicoesDisponiveis';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjecaoVendasModalProps {
  open: boolean;
  onClose: () => void;
  projecao: ProjecaoVendas;
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatCurrencyDecimal = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'accepted': return 'bg-green-100 text-green-700';
    case 'sent': return 'bg-blue-100 text-blue-700';
    case 'opened': return 'bg-purple-100 text-purple-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'expired': return 'bg-gray-100 text-gray-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'accepted': return 'Aceita';
    case 'sent': return 'Enviada';
    case 'opened': return 'Aberta';
    case 'pending': return 'Pendente';
    case 'expired': return 'Expirada';
    case 'rejected': return 'Rejeitada';
    default: return status;
  }
};

export const ProjecaoVendasModal: React.FC<ProjecaoVendasModalProps> = ({
  open,
  onClose,
  projecao,
  onRefresh
}) => {
  const [showPropostas, setShowPropostas] = useState(true);
  const [showPredios, setShowPredios] = useState(false);

  const lastUpdated = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-white/95 backdrop-blur-2xl border border-white/30 shadow-2xl overflow-hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col h-full max-h-[90vh]"
            >
              {/* Header */}
              <div className="relative p-6 pb-4 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-b border-emerald-100">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Projeção de Valor Disponível
                    </h2>
                    <p className="text-sm text-gray-600">
                      Baseado na média das últimas {projecao.propostas.length} propostas
                    </p>
                  </div>
                </div>

                {/* Total Value Highlight */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-emerald-100">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Valor Total Projetado</p>
                      <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {formatCurrency(projecao.total)}
                        <span className="text-lg font-normal text-gray-500">/mês</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        <span><strong>{projecao.totalPrediosComPreco}</strong> prédios</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span><strong>{projecao.totalPosicoesComPreco}</strong> posições</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg">
                        <Calculator className="h-4 w-4 text-amber-600" />
                        <span>Média: <strong>{formatCurrencyDecimal(projecao.precoMedioGeral)}</strong>/pos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Últimas 15 Propostas - Base do Cálculo */}
                <div>
                  <button 
                    onClick={() => setShowPropostas(!showPropostas)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Base do Cálculo: Últimas {projecao.propostas.length} Propostas
                    </div>
                    {showPropostas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  <AnimatePresence>
                    {showPropostas && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          {projecao.propostas.length > 0 ? (
                            projecao.propostas.map((proposta, index) => (
                              <motion.div
                                key={proposta.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {proposta.number}
                                      </span>
                                      <Badge className={`text-xs ${getStatusColor(proposta.status)}`}>
                                        {getStatusLabel(proposta.status)}
                                      </Badge>
                                    </div>
                                    
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {proposta.clientCompanyName || proposta.clientName}
                                    </h4>
                                    
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{proposta.sellerName}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        <span>{proposta.totalPanels} {proposta.totalPanels === 1 ? 'prédio' : 'prédios'}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                          {proposta.isCustomDays 
                                            ? `${proposta.customDays} dias` 
                                            : `${proposta.durationMonths} ${proposta.durationMonths === 1 ? 'mês' : 'meses'}`}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                          {proposta.createdAt && format(new Date(proposta.createdAt), "dd/MM/yy", { locale: ptBR })}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Prédios */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {proposta.predios.slice(0, 3).map((predio, i) => (
                                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                                          {predio}
                                        </span>
                                      ))}
                                      {proposta.predios.length > 3 && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                          +{proposta.predios.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-right shrink-0">
                                    <p className="text-lg font-bold text-emerald-600">
                                      {formatCurrencyDecimal(proposta.valorMensal)}
                                    </p>
                                    <p className="text-xs text-gray-400">/mês</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Total: {formatCurrency(proposta.valorTotal)}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p>Nenhuma proposta encontrada para calcular média</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Detalhamento por Prédio */}
                <div>
                  <button 
                    onClick={() => setShowPredios(!showPredios)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Projeção por Prédio ({projecao.porPredio.length})
                    </div>
                    {showPredios ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  <AnimatePresence>
                    {showPredios && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          {projecao.porPredio.length > 0 ? (
                            projecao.porPredio.map((predio, index) => (
                              <motion.div
                                key={predio.buildingId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-gray-900 truncate">
                                        {predio.nome}
                                      </h4>
                                      <Badge variant="outline" className="text-xs bg-gray-50 shrink-0">
                                        {predio.bairro}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      <span className="font-medium text-emerald-600">{predio.disponiveis}</span> posições × {formatCurrencyDecimal(predio.precoMedio)}/mês
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-lg font-bold text-emerald-600">
                                      {formatCurrency(predio.valorProjecao)}
                                    </p>
                                    <p className="text-xs text-gray-400">/mês</p>
                                  </div>
                                </div>
                                
                                {/* Mini progress showing opportunity */}
                                <div className="mt-3 flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                    <div 
                                      className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1.5 rounded-full"
                                      style={{ width: `${Math.min(100, (predio.valorProjecao / (projecao.total || 1)) * 100 * 3)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {((predio.valorProjecao / (projecao.total || 1)) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p>Nenhum prédio com posições disponíveis</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Como Calculamos */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Como Calculamos
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0 mt-0.5">
                        <Info className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Fórmula</p>
                        <code className="text-xs bg-white px-2 py-1 rounded border mt-1 inline-block font-mono">
                          Valor = Σ (Posições Disponíveis × Preço Médio por Posição)
                        </code>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0 mt-0.5">
                        <FileText className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Base de Dados</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          O preço médio é calculado a partir das <strong>últimas {projecao.propostas.length} propostas</strong>, 
                          dividindo o valor mensal pelo número de prédios em cada proposta.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0 mt-0.5">
                        <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Preço Médio Atual</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Média geral: <strong>{formatCurrencyDecimal(projecao.precoMedioGeral)}</strong> por posição/mês. 
                          Prédios com histórico de propostas usam sua própria média.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Atualizado em: {lastUpdated}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Atualizar Dados
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ProjecaoVendasModal;