import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, Mail, Phone, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateCPF } from '@/utils/inputValidation';

// Format CPF helper
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};
import { cn } from '@/lib/utils';

interface ContractData {
  primeiro_nome: string;
  sobrenome: string;
  data_nascimento: string;
  cpf: string;
  email: string;
  telefone: string;
}

interface ContractDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ContractData) => void;
  initialData?: Partial<ContractData>;
  isLoading?: boolean;
}

export const ContractDataModal: React.FC<ContractDataModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ContractData>({
    primeiro_nome: '',
    sobrenome: '',
    data_nascimento: '',
    cpf: '',
    email: '',
    telefone: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize with provided data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        primeiro_nome: initialData.primeiro_nome || '',
        sobrenome: initialData.sobrenome || '',
        data_nascimento: initialData.data_nascimento || '',
        cpf: initialData.cpf || '',
        email: initialData.email || '',
        telefone: initialData.telefone || ''
      }));
    }
  }, [initialData]);

  // Identify which fields are missing
  const missingFields = {
    primeiro_nome: !formData.primeiro_nome.trim(),
    sobrenome: !formData.sobrenome.trim(),
    data_nascimento: !formData.data_nascimento,
    cpf: !formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11,
    email: !formData.email.trim()
  };

  const hasMissingFields = Object.values(missingFields).some(v => v);

  // Validate field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'primeiro_nome':
        if (!value.trim()) return 'Nome é obrigatório';
        if (value.trim().length < 2) return 'Nome muito curto';
        return '';
      case 'sobrenome':
        if (!value.trim()) return 'Sobrenome é obrigatório';
        if (value.trim().length < 2) return 'Sobrenome muito curto';
        return '';
      case 'data_nascimento':
        if (!value) return 'Data de nascimento é obrigatória';
        const date = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        if (age < 18) return 'Você precisa ter 18 anos ou mais';
        if (age > 120) return 'Data inválida';
        return '';
      case 'cpf':
        const cpfClean = value.replace(/\D/g, '');
        if (!cpfClean) return 'CPF é obrigatório';
        if (cpfClean.length !== 11) return 'CPF deve ter 11 dígitos';
        if (!validateCPF(cpfClean)) return 'CPF inválido';
        return '';
      case 'email':
        if (!value.trim()) return 'E-mail é obrigatório';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'E-mail inválido';
        return '';
      default:
        return '';
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Format CPF
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    }
    
    // Format phone
    if (name === 'telefone') {
      formattedValue = value.replace(/\D/g, '').slice(0, 11);
      if (formattedValue.length >= 3) {
        formattedValue = `(${formattedValue.slice(0, 2)}) ${formattedValue.slice(2)}`;
      }
      if (formattedValue.length >= 10) {
        formattedValue = formattedValue.slice(0, 10) + '-' + formattedValue.slice(10);
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Validate on change if already touched
    if (touched[name]) {
      const error = validateField(name, formattedValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const newErrors: Record<string, string> = {};
    const requiredFields = ['primeiro_nome', 'sobrenome', 'data_nascimento', 'cpf', 'email'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof ContractData]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    setTouched(requiredFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    
    if (Object.keys(newErrors).length === 0) {
      onComplete(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#9C1E1E]/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#9C1E1E]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Dados para Contrato</h2>
                <p className="text-xs text-gray-500">Complete seus dados para gerar o contrato</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Estes dados são necessários para a <strong>assinatura digital</strong> do contrato via ClickSign.
            </p>
          </div>

          {/* Nome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primeiro_nome" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Primeiro Nome *
              </Label>
              <Input
                id="primeiro_nome"
                name="primeiro_nome"
                value={formData.primeiro_nome}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="João"
                className={cn(
                  "h-12 rounded-xl border-gray-200 focus:border-[#9C1E1E] focus:ring-[#9C1E1E]/20",
                  errors.primeiro_nome && touched.primeiro_nome && "border-red-500 focus:border-red-500"
                )}
              />
              {errors.primeiro_nome && touched.primeiro_nome && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.primeiro_nome}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sobrenome" className="text-sm font-medium text-gray-700">
                Sobrenome *
              </Label>
              <Input
                id="sobrenome"
                name="sobrenome"
                value={formData.sobrenome}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Silva"
                className={cn(
                  "h-12 rounded-xl border-gray-200 focus:border-[#9C1E1E] focus:ring-[#9C1E1E]/20",
                  errors.sobrenome && touched.sobrenome && "border-red-500 focus:border-red-500"
                )}
              />
              {errors.sobrenome && touched.sobrenome && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.sobrenome}
                </p>
              )}
            </div>
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label htmlFor="data_nascimento" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              Data de Nascimento *
            </Label>
            <Input
              id="data_nascimento"
              name="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={handleChange}
              onBlur={handleBlur}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className={cn(
                "h-12 rounded-xl border-gray-200 focus:border-[#9C1E1E] focus:ring-[#9C1E1E]/20",
                errors.data_nascimento && touched.data_nascimento && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.data_nascimento && touched.data_nascimento && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.data_nascimento}
              </p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              CPF *
            </Label>
            <Input
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="000.000.000-00"
              maxLength={14}
              className={cn(
                "h-12 rounded-xl border-gray-200 focus:border-[#9C1E1E] focus:ring-[#9C1E1E]/20",
                errors.cpf && touched.cpf && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.cpf && touched.cpf && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.cpf}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              E-mail *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="seu@email.com"
              className={cn(
                "h-12 rounded-xl border-gray-200 focus:border-[#9C1E1E] focus:ring-[#9C1E1E]/20",
                errors.email && touched.email && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.email && touched.email && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Telefone (optional) */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              Telefone (opcional)
            </Label>
            <Input
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              className="h-12 rounded-xl border-gray-200 focus:border-[#9C1E1E] focus:ring-[#9C1E1E]/20"
            />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-[#9C1E1E] hover:bg-[#7D1818] text-white font-medium text-base shadow-lg shadow-[#9C1E1E]/25 transition-all hover:shadow-xl hover:shadow-[#9C1E1E]/30"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Gerando Contrato...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Continuar para Prévia do Contrato
              </div>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Seus dados são protegidos e usados apenas para formalização do contrato.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ContractDataModal;
