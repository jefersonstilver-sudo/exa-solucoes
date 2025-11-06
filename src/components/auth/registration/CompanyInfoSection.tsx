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
        return 'RUC da empresa argentina';
      case 'PY':
        return 'RUC da empresa paraguaia';
      default:
        return 'Número do documento';
    }
  };

  const formatDocument = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (companyCountry === 'BR') {
      // Format CNPJ: 00.000.000/0000-00
      if (cleaned.length <= 14) {
        return cleaned
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      }
    }
    
    return cleaned;
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
              {companyCountry === 'BR' 
                ? 'Digite apenas números, a formatação será automática' 
                : 'Informe o RUC conforme documentação oficial'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
