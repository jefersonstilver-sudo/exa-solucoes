import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Building2 } from 'lucide-react';

interface PersonTypeSelectorProps {
  value: 'individual' | 'company';
  onChange: (value: 'individual' | 'company') => void;
}

export const PersonTypeSelector: React.FC<PersonTypeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-gray-900">
        Tipo de Cadastro <span className="text-red-500">*</span>
      </Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 gap-4">
        <label
          htmlFor="individual"
          className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            value === 'individual'
              ? 'border-exa-red bg-exa-red/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <RadioGroupItem value="individual" id="individual" />
          <div className="flex items-center space-x-2">
            <User className={`h-5 w-5 ${value === 'individual' ? 'text-exa-red' : 'text-gray-600'}`} />
            <span className="font-medium text-gray-900">Pessoa Física</span>
          </div>
        </label>
        
        <label
          htmlFor="company"
          className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            value === 'company'
              ? 'border-exa-red bg-exa-red/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <RadioGroupItem value="company" id="company" />
          <div className="flex items-center space-x-2">
            <Building2 className={`h-5 w-5 ${value === 'company' ? 'text-exa-red' : 'text-gray-600'}`} />
            <span className="font-medium text-gray-900">Empresa/Marca</span>
          </div>
        </label>
      </RadioGroup>
    </div>
  );
};
