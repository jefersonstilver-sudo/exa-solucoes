
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface LoginFormFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  error: string | null;
  setIsResetMode: (value: boolean) => void;
}

export const LoginFormFields = ({
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  error,
  setIsResetMode
}: LoginFormFieldsProps) => {
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Button
              variant="link"
              type="button"
              className="text-xs text-indexa-purple p-0 h-auto font-normal"
              onClick={() => setIsResetMode(true)}
              disabled={isLoading}
            >
              Esqueceu a senha?
            </Button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
      </div>
    </>
  );
};
