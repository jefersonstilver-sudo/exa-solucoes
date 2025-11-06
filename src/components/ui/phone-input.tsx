import React, { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCountryChange?: (country: string, code: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  defaultCountry?: 'BR' | 'PY' | 'AR';
}

const countries = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', phoneCode: '+55' },
  { code: 'PY', name: 'Paraguai', flag: '🇵🇾', phoneCode: '+595' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', phoneCode: '+54' }
];

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onCountryChange, placeholder = "00000-0000", required = false, className = "", defaultCountry = 'BR', ...props }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
    
    const currentCountry = countries.find(c => c.code === selectedCountry) || countries[0];
    
    const formatPhone = (input: string): string => {
      const digits = input.replace(/\D/g, '');
      
      if (selectedCountry === 'BR') {
        // Brasil: (00) 00000-0000
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
      } else if (selectedCountry === 'PY') {
        // Paraguai: 000-000000
        if (digits.length <= 3) return digits;
        return `${digits.slice(0, 3)}-${digits.slice(3, 9)}`;
      } else if (selectedCountry === 'AR') {
        // Argentina: 00-0000-0000
        if (digits.length <= 2) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
      }
      
      return digits;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value);
      e.target.value = formatted;
      onChange(e);
    };

    const handleCountryChange = (countryCode: string) => {
      setSelectedCountry(countryCode as 'BR' | 'PY' | 'AR');
      const country = countries.find(c => c.code === countryCode);
      if (country && onCountryChange) {
        onCountryChange(countryCode, country.phoneCode);
      }
    };

    return (
      <div className="space-y-2">
        <Label className="flex items-center text-gray-900">
          <Phone className="h-4 w-4 mr-2 text-exa-red" /> 
          Seu Whatsapp {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="flex gap-2">
          <Select value={selectedCountry} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-[140px] h-11 bg-white border-gray-300">
              <SelectValue>
                <span className="flex items-center">
                  {currentCountry.flag} {currentCountry.phoneCode}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white z-[100]">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    {country.flag} {country.name} {country.phoneCode}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            ref={ref}
            type="tel"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            className={`flex-1 h-11 border-gray-300 focus:border-exa-red ${className}`}
            maxLength={15}
            {...props}
          />
        </div>
        <p className="text-xs text-gray-500">
          {selectedCountry === 'BR' && 'Formato: (00) 00000-0000'}
          {selectedCountry === 'PY' && 'Formato: 000-000000'}
          {selectedCountry === 'AR' && 'Formato: 00-0000-0000'}
        </p>
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };