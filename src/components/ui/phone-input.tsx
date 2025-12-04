import React, { forwardRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone } from 'lucide-react';
import { cleanPhone, COUNTRY_CODES, type CountryCode } from '@/utils/whatsapp';

interface PhoneInputProps {
  value: string;
  onChange: (value: string, fullNumber: string, countryCode: CountryCode) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  defaultCountry?: CountryCode;
  label?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const countries: Array<{ code: CountryCode; name: string; flag: string; phoneCode: string }> = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', phoneCode: '+55' },
  { code: 'PY', name: 'Paraguai', flag: '🇵🇾', phoneCode: '+595' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', phoneCode: '+54' },
  { code: 'UY', name: 'Uruguai', flag: '🇺🇾', phoneCode: '+598' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', phoneCode: '+56' },
  { code: 'US', name: 'EUA', flag: '🇺🇸', phoneCode: '+1' }
];

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "00000-0000", 
    required = false, 
    className = "", 
    defaultCountry = 'BR',
    label = "Telefone WhatsApp",
    showLabel = true,
    compact = false,
    ...props 
  }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountry);
    
    const currentCountry = countries.find(c => c.code === selectedCountry) || countries[0];
    
    // Detectar país inicial baseado no valor
    useEffect(() => {
      if (value) {
        const clean = cleanPhone(value);
        if (clean.startsWith('595')) setSelectedCountry('PY');
        else if (clean.startsWith('54')) setSelectedCountry('AR');
        else if (clean.startsWith('598')) setSelectedCountry('UY');
        else if (clean.startsWith('56')) setSelectedCountry('CL');
        else if (clean.startsWith('1') && clean.length >= 11) setSelectedCountry('US');
        else if (clean.startsWith('55') || defaultCountry === 'BR') setSelectedCountry('BR');
      }
    }, []);
    
    const formatPhone = (input: string, country: CountryCode): string => {
      const digits = cleanPhone(input);
      
      switch (country) {
        case 'BR':
          // Brasil: (00) 00000-0000
          if (digits.length <= 2) return digits;
          if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
          return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
          
        case 'PY':
          // Paraguai: 000-000000
          if (digits.length <= 3) return digits;
          return `${digits.slice(0, 3)}-${digits.slice(3, 9)}`;
          
        case 'AR':
          // Argentina: 00-0000-0000
          if (digits.length <= 2) return digits;
          if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
          return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
          
        case 'UY':
          // Uruguai: 0000-0000
          if (digits.length <= 4) return digits;
          return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
          
        case 'CL':
          // Chile: 0-0000-0000
          if (digits.length <= 1) return digits;
          if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
          return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 9)}`;
          
        case 'US':
          // EUA: (000) 000-0000
          if (digits.length <= 3) return digits;
          if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
          
        default:
          return digits;
      }
    };

    const getMaxLength = (country: CountryCode): number => {
      switch (country) {
        case 'BR': return 15; // (00) 00000-0000
        case 'PY': return 10; // 000-000000
        case 'AR': return 13; // 00-0000-0000
        case 'UY': return 9;  // 0000-0000
        case 'CL': return 12; // 0-0000-0000
        case 'US': return 14; // (000) 000-0000
        default: return 15;
      }
    };

    const getPlaceholder = (country: CountryCode): string => {
      switch (country) {
        case 'BR': return '(00) 00000-0000';
        case 'PY': return '000-000000';
        case 'AR': return '00-0000-0000';
        case 'UY': return '0000-0000';
        case 'CL': return '0-0000-0000';
        case 'US': return '(000) 000-0000';
        default: return '00000-0000';
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value, selectedCountry);
      const digits = cleanPhone(formatted);
      const countryData = COUNTRY_CODES[selectedCountry];
      const fullNumber = `${countryData.code}${digits}`;
      
      onChange(formatted, fullNumber, selectedCountry);
    };

    const handleCountryChange = (countryCode: string) => {
      const newCountry = countryCode as CountryCode;
      setSelectedCountry(newCountry);
      
      // Reformatar o número atual para o novo país
      const digits = cleanPhone(value);
      const formatted = formatPhone(digits, newCountry);
      const countryData = COUNTRY_CODES[newCountry];
      const fullNumber = `${countryData.code}${digits}`;
      
      onChange(formatted, fullNumber, newCountry);
    };

    return (
      <div className={`space-y-2 ${compact ? 'space-y-1' : ''}`}>
        {showLabel && (
          <Label className="flex items-center text-gray-900">
            <Phone className="h-4 w-4 mr-2 text-primary" /> 
            {label} {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="flex gap-2">
          <Select value={selectedCountry} onValueChange={handleCountryChange}>
            <SelectTrigger className={`w-[110px] ${compact ? 'h-10' : 'h-11'} bg-white border-gray-300`}>
              <SelectValue>
                <span className="flex items-center text-sm">
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
            placeholder={getPlaceholder(selectedCountry)}
            required={required}
            className={`flex-1 ${compact ? 'h-10' : 'h-11'} border-gray-300 focus:border-primary ${className}`}
            maxLength={getMaxLength(selectedCountry)}
            {...props}
          />
        </div>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            Formato: {getPlaceholder(selectedCountry)}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
export type { CountryCode };
