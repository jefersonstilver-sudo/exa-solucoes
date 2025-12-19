import React, { useState, KeyboardEvent } from 'react';
import { X, Plus, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface CCEmailsInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  label?: string;
  placeholder?: string;
  maxEmails?: number;
  disabled?: boolean;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const CCEmailsInput: React.FC<CCEmailsInputProps> = ({
  value = [],
  onChange,
  label = 'E-mails de Cópia (CC)',
  placeholder = 'Digite um e-mail e pressione Enter',
  maxEmails = 10,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addEmail = () => {
    const email = inputValue.trim().toLowerCase();
    
    if (!email) return;
    
    if (!isValidEmail(email)) {
      setError('E-mail inválido');
      return;
    }
    
    if (value.includes(email)) {
      setError('E-mail já adicionado');
      return;
    }
    
    if (value.length >= maxEmails) {
      setError(`Máximo de ${maxEmails} e-mails`);
      return;
    }
    
    onChange([...value, email]);
    setInputValue('');
    setError(null);
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(value.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
    // Clear error when typing
    if (error) setError(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {label}
        </Label>
      )}
      
      <div className="flex gap-2">
        <Input
          type="email"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || value.length >= maxEmails}
          className={error ? 'border-destructive' : ''}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addEmail}
          disabled={disabled || !inputValue.trim() || value.length >= maxEmails}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((email, index) => (
            <Badge
              key={`${email}-${index}`}
              variant="secondary"
              className="flex items-center gap-1 py-1 px-2"
            >
              <Mail className="h-3 w-3" />
              <span className="text-xs">{email}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Estes e-mails receberão cópias de todas as notificações (vídeos, pagamentos, contratos)
      </p>
    </div>
  );
};

export default CCEmailsInput;
