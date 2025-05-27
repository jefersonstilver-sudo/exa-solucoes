
import React from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormFieldsProps {
  email: string;
  password: string;
  showPassword: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
}

const LoginFormFields: React.FC<LoginFormFieldsProps> = ({
  email,
  password,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword
}) => {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
            placeholder="exemplo@email.com"
            required
          />
        </div>
      </div>
      
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Senha</label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="w-full bg-gray-900/50 border-gray-700 text-white pr-10"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default LoginFormFields;
