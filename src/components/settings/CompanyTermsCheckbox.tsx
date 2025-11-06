import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface CompanyTermsCheckboxProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}

const COMPANY_TERMS_TEXT = `
TERMO DE RESPONSABILIDADE E AUTORIZAÇÃO

Ao marcar esta opção, eu declaro sob as penas da lei que:

1. Tenho plena AUTONOMIA e PODERES LEGAIS para representar e divulgar 
   a empresa/marca mencionada acima.

2. Possuo autorização expressa (por escrito ou verbal) da empresa/marca 
   para criar e veicular conteúdo publicitário em seu nome.

3. Estou ciente que a EXA MÍDIA LTDA não se responsabiliza por 
   FALSAS DECLARAÇÕES ou uso indevido de marcas/empresas.

4. A EXA poderá, a qualquer momento, solicitar DOCUMENTOS COMPROBATÓRIOS 
   que atestem minha vinculação com a empresa/marca, incluindo mas não 
   limitado a:
   - Contrato social/estatuto
   - Procuração com poderes específicos
   - Carta de autorização assinada
   - Crachá/carteira funcional
   - Comprovante de vínculo empregatício

5. Em caso de não apresentação dos documentos solicitados, a EXA reserva-se 
   o direito de SUSPENDER ou CANCELAR minhas campanhas sem aviso prévio.

6. Assumo total responsabilidade por quaisquer ações legais decorrentes 
   de declarações falsas ou uso indevido de marca.

Declaro que li, compreendi e concordo com os termos acima.
`;

export const CompanyTermsCheckbox: React.FC<CompanyTermsCheckboxProps> = ({ 
  accepted, 
  onAcceptedChange 
}) => {
  return (
    <div className="border-2 border-amber-500 rounded-lg p-4 bg-amber-50">
      <Label className="font-semibold text-amber-900 mb-2 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Termo de Responsabilidade
      </Label>
      
      <div className="text-xs text-gray-700 max-h-40 overflow-y-auto border rounded p-3 bg-white mb-3 whitespace-pre-line">
        {COMPANY_TERMS_TEXT}
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="company-terms" 
          checked={accepted}
          onCheckedChange={onAcceptedChange}
        />
        <label htmlFor="company-terms" className="text-sm text-gray-700 cursor-pointer">
          Li e concordo com o Termo de Responsabilidade acima <span className="text-red-500">*</span>
        </label>
      </div>
    </div>
  );
};
