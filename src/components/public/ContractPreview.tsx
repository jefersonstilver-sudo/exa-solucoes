import React, { useState } from 'react';
import { X, FileText, Check, ChevronDown, ChevronUp, Building2, Calendar, CreditCard, Shield, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useExibicoesConfig } from '@/hooks/useExibicoesConfig';

interface ContractPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  contractData: {
    cliente_nome: string;
    cliente_empresa?: string;
    cliente_cnpj?: string;
    cliente_cpf?: string;
    cliente_email: string;
    valor_total: number;
    valor_mensal?: number;
    plano_meses: number;
    data_inicio: Date;
    data_fim: Date;
    lista_predios: Array<{
      building_id: string;
      building_name: string;
      quantidade_telas?: number;
    }>;
    metodo_pagamento?: string;
    parcelas?: Array<{
      installment: number;
      due_date: string;
      amount: number;
    }>;
  };
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const ContractPreview: React.FC<ContractPreviewProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  contractData
}) => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('resumo');
  
  // Hook centralizado - FONTE ÚNICA DE VERDADE
  const { getEspecificacoesContrato, getTextoEspecificacoes } = useExibicoesConfig();
  const specs = getEspecificacoesContrato('horizontal');

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const totalPanels = contractData.lista_predios.reduce((sum, b) => sum + (b.quantidade_telas || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#9C1E1E] to-[#B52525] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Prévia do Contrato</h2>
                <p className="text-sm text-white/80">Leia atentamente antes de confirmar</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Resumo do Contrato */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('resumo')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#9C1E1E]/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#9C1E1E]" />
                </div>
                <span className="font-semibold text-gray-900">Resumo do Contrato</span>
              </div>
              {expandedSection === 'resumo' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'resumo' && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1">Contratante</p>
                    <p className="font-semibold text-gray-900">{contractData.cliente_nome}</p>
                    {contractData.cliente_empresa && (
                      <p className="text-xs text-gray-600">{contractData.cliente_empresa}</p>
                    )}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1">Documento</p>
                    <p className="font-semibold text-gray-900">
                      {contractData.cliente_cnpj || contractData.cliente_cpf || '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1">Valor Total</p>
                    <p className="font-bold text-[#9C1E1E] text-lg">{formatCurrency(contractData.valor_total)}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1">Duração</p>
                    <p className="font-semibold text-gray-900">{contractData.plano_meses} meses</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Locais Contratados */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('locais')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Locais Contratados</span>
                  <p className="text-xs text-gray-500">{contractData.lista_predios.length} prédios • {totalPanels} telas</p>
                </div>
              </div>
              {expandedSection === 'locais' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'locais' && (
              <div className="px-4 pb-4">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {contractData.lista_predios.map((predio, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm text-gray-900">{predio.building_name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {predio.quantidade_telas || 1} tela{(predio.quantidade_telas || 1) > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Período e Pagamento */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('pagamento')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-semibold text-gray-900">Período e Pagamento</span>
              </div>
              {expandedSection === 'pagamento' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'pagamento' && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Início
                    </p>
                    <p className="font-semibold text-gray-900">
                      {format(contractData.data_inicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Término
                    </p>
                    <p className="font-semibold text-gray-900">
                      {format(contractData.data_fim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {contractData.parcelas && contractData.parcelas.length > 1 && (
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500 text-xs mb-2">Parcelas</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {contractData.parcelas.map((parcela, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {idx + 1}ª - {format(new Date(parcela.due_date), 'dd/MM/yyyy')}
                          </span>
                          <span className="font-medium text-gray-900">{formatCurrency(parcela.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cláusulas Principais */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('clausulas')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-semibold text-gray-900">Cláusulas Principais</span>
              </div>
              {expandedSection === 'clausulas' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'clausulas' && (
              <div className="px-4 pb-4 space-y-3 text-sm text-gray-700">
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <p className="font-medium text-gray-900 mb-1">1. Objeto do Contrato</p>
                  <p className="text-gray-600">Contratação de espaço publicitário em painéis digitais de elevadores, com veiculação de vídeo de até {specs.duracao} segundos.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <p className="font-medium text-gray-900 mb-1">2. Especificações Técnicas</p>
                  <p className="text-gray-600">{getTextoEspecificacoes('horizontal')}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <p className="font-medium text-gray-900 mb-1">3. Direitos de Imagem</p>
                  <p className="text-gray-600">O CONTRATANTE declara ser proprietário ou ter autorização de uso de todo o conteúdo veiculado, isentando a EXA de responsabilidades sobre direitos autorais.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <p className="font-medium text-gray-900 mb-1">4. Pagamento</p>
                  <p className="text-gray-600">O pagamento deverá ser realizado conforme condições acordadas. O não pagamento implica na suspensão imediata da veiculação.</p>
                </div>
              </div>
            )}
          </div>

          {/* Accept Terms */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <Checkbox
              id="accept-terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="mt-0.5 border-amber-400 data-[state=checked]:bg-[#9C1E1E] data-[state=checked]:border-[#9C1E1E]"
            />
            <label htmlFor="accept-terms" className="text-sm text-amber-900 cursor-pointer">
              Li e concordo com todas as cláusulas do contrato. Entendo que após o pagamento, receberei o <strong>link de assinatura digital</strong> por e-mail.
            </label>
          </div>

          {/* Info about signature */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Próximos passos após o pagamento:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Você receberá um e-mail com o link para assinatura digital</li>
                <li>Assine o contrato eletronicamente via ClickSign</li>
                <li>Seu plano será ativado assim que a assinatura for confirmada</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
          <Button
            onClick={onConfirm}
            disabled={!acceptTerms || isLoading}
            className="w-full h-14 rounded-2xl bg-[#9C1E1E] hover:bg-[#7D1818] text-white font-medium text-base shadow-lg shadow-[#9C1E1E]/25 transition-all hover:shadow-xl hover:shadow-[#9C1E1E]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Concordo e Quero Pagar
              </div>
            )}
          </Button>
          
          <button
            onClick={onClose}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractPreview;
