import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder = "(00) 00000-0000", required = false, className = "", ...props }, ref) => {
    
    const formatPhone = (input: string): string => {
      const digits = input.replace(/\D/g, '');
      
      if (digits.length <= 10) {
        // Formato antigo: (00) 0000-0000
        if (digits.length <= 2) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
      } else {
        // Formato novo: (00) 00000-0000
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value);
      e.target.value = formatted;
      onChange(e);
    };

    return (
      <div className="space-y-2">
        <Label className="flex items-center text-gray-900">
          <Phone className="h-4 w-4 mr-2 text-indexa-purple" /> 
          Celular {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          ref={ref}
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500 ${className}`}
          maxLength={15}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };