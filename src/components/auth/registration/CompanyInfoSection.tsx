import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, FileText } from 'lucide-react';

interface CompanyInfoSectionProps {
  companyName: string;
  companyCountry: string;
  companyDocument: string;
  onCompanyNameChange: (value: string) => void;
  onCompanyCountryChange: (value: string) => void;
  onCompanyDocumentChange: (value: string) => void;
}

export const CompanyInfoSection: React.FC<CompanyInfoSectionProps> = ({
  companyName,
  companyCountry,
  companyDocument,
  onCompanyNameChange,
  onCompanyCountryChange,
  onCompanyDocumentChange
}) => {
  const getDocumentLabel = () => {
    switch (companyCountry) {
      case 'BR':
        return 'CNPJ';
      case 'AR':
        return 'CUIT';
      case 'PY':
        return 'RUC';
      default:
        return 'Documento da Empresa';
    }
  };

  const getDocumentPlaceholder = () => {
    switch (companyCountry) {
      case 'BR':
        return '00.000.000/0000-00';
      case 'AR':
        return '20-12345678-3';
      case 'PY':
        return '80012345-6';
      default:
        return 'Número do documento';
    }
  };

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    switch (companyCountry) {
      case 'BR': // CNPJ: 00.000.000/0000-00
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
        if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
        if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
        
      case 'AR': // CUIT: 20-12345678-3
        if (digits.length <= 2) return digits;
        if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10, 11)}`;
        
      case 'PY': // RUC: 80012345-6
        if (digits.length <= 8) return digits;
        return `${digits.slice(0, 8)}-${digits.slice(8, 9)}`;
        
      default:
        return digits;
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value);
    onCompanyDocumentChange(formatted);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-300">
        <Building2 className="h-5 w-5 text-exa-red" />
        <h3 className="text-lg font-semibold text-gray-900">Informações da Empresa</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyCountry" className="text-sm font-medium text-gray-900">
            País da Empresa <span className="text-red-500">*</span>
          </Label>
          <Select value={companyCountry} onValueChange={onCompanyCountryChange}>
            <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-exa-red">
              <SelectValue placeholder="Selecione o país" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
              <SelectItem value="PY">🇵🇾 Paraguai</SelectItem>
              <SelectItem value="AR">🇦🇷 Argentina</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex items-center text-sm font-medium text-gray-900">
            <Building2 className="h-4 w-4 mr-2 text-exa-red" />
            Nome da Empresa/Marca <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Nome completo da empresa"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            required
            className="h-11 bg-white border-gray-300 focus:border-exa-red text-gray-900 placeholder-gray-500"
          />
        </div>

        {companyCountry && (
          <div className="space-y-2">
            <Label htmlFor="companyDocument" className="flex items-center text-sm font-medium text-gray-900">
              <FileText className="h-4 w-4 mr-2 text-exa-red" />
              {getDocumentLabel()} <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="companyDocument"
              type="text"
              placeholder={getDocumentPlaceholder()}
              value={companyDocument}
              onChange={handleDocumentChange}
              required
              className="h-11 bg-white border-gray-300 focus:border-exa-red text-gray-900 placeholder-gray-500"
            />
            <p className="text-xs text-gray-600">
              {companyCountry === 'BR' && 'Digite apenas números, a formatação será automática'}
              {companyCountry === 'AR' && 'CUIT emitido pela AFIP - formatação automática'}
              {companyCountry === 'PY' && 'RUC emitido pela SET - formatação automática'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
