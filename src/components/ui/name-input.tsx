import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { capitalizeNameParts } from '@/utils/nameValidation';

export interface NameInputProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  errors?: { firstName?: string; lastName?: string };
  firstNameLabel?: string;
  lastNameLabel?: string;
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
  className?: string;
  autoCapitalize?: boolean;
  compact?: boolean;
}

/**
 * Componente reutilizável para entrada de Nome e Sobrenome
 * Usado globalmente em todos os formulários que requerem nome completo
 */
export const NameInput: React.FC<NameInputProps> = ({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  required = true,
  disabled = false,
  errors,
  firstNameLabel = 'Nome',
  lastNameLabel = 'Sobrenome',
  firstNamePlaceholder = 'Digite o nome',
  lastNamePlaceholder = 'Digite o sobrenome',
  className,
  autoCapitalize = true,
  compact = false,
}) => {
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = autoCapitalize ? capitalizeNameParts(e.target.value) : e.target.value;
    onFirstNameChange(value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = autoCapitalize ? capitalizeNameParts(e.target.value) : e.target.value;
    onLastNameChange(value);
  };

  const inputClassName = compact ? 'h-9 text-sm' : 'h-10';
  const labelClassName = compact ? 'text-xs font-medium' : 'text-sm font-medium';

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      <div className="space-y-1.5">
        <Label className={labelClassName}>
          {firstNameLabel} {required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          value={firstName}
          onChange={handleFirstNameChange}
          placeholder={firstNamePlaceholder}
          disabled={disabled}
          className={cn(
            inputClassName,
            errors?.firstName && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {errors?.firstName && (
          <p className="text-[10px] text-destructive">{errors.firstName}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className={labelClassName}>
          {lastNameLabel} {required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          value={lastName}
          onChange={handleLastNameChange}
          placeholder={lastNamePlaceholder}
          disabled={disabled}
          className={cn(
            inputClassName,
            errors?.lastName && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {errors?.lastName && (
          <p className="text-[10px] text-destructive">{errors.lastName}</p>
        )}
      </div>
    </div>
  );
};

export default NameInput;
