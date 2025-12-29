import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Shield, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Send,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdditionalConfiguration } from '@/hooks/useAdditionalConfigurations';

interface Login2FAConfigProps {
  config: AdditionalConfiguration | null;
  updateConfig: (updates: Partial<AdditionalConfiguration>) => Promise<boolean>;
}

export const Login2FAConfig: React.FC<Login2FAConfigProps> = ({ config, updateConfig }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (config) {
      setIsEnabled((config as any).login_2fa_master_ativo || false);
      setPhoneNumber((config as any).login_2fa_telefone_master || '');
    }
  }, [config]);

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limited = numbers.slice(0, 11);
    
    // Formata como (XX) XXXXX-XXXX
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const getCleanPhone = () => {
    return phoneNumber.replace(/\D/g, '');
  };

  const isPhoneValid = () => {
    const clean = getCleanPhone();
    return clean.length === 10 || clean.length === 11;
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled && !isPhoneValid()) {
      toast.error('Por favor, insira um número de telefone válido antes de ativar');
      return;
    }

    setSaving(true);
    const success = await updateConfig({
      login_2fa_master_ativo: enabled,
      login_2fa_telefone_master: getCleanPhone()
    } as any);

    if (success) {
      setIsEnabled(enabled);
      toast.success(enabled ? '2FA ativado com sucesso!' : '2FA desativado');
    }
    setSaving(false);
  };

  const handleSavePhone = async () => {
    if (!isPhoneValid()) {
      toast.error('Número de telefone inválido');
      return;
    }

    setSaving(true);
    const success = await updateConfig({
      login_2fa_telefone_master: getCleanPhone()
    } as any);

    if (success) {
      toast.success('Telefone salvo com sucesso!');
    }
    setSaving(false);
  };

  const handleTestCode = async () => {
    if (!isPhoneValid()) {
      toast.error('Número de telefone inválido');
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-exa-verification-code', {
        body: {
          phone: `55${getCleanPhone()}`,
          purpose: 'test_2fa'
        }
      });

      if (error) throw error;

      setTestSent(true);
      toast.success('Código de teste enviado via WhatsApp!');
      
      // Reset após 5 segundos
      setTimeout(() => setTestSent(false), 5000);
    } catch (error) {
      console.error('Erro ao enviar código de teste:', error);
      toast.error('Erro ao enviar código de teste');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Autenticação em Dois Fatores (2FA)
            </CardTitle>
            <CardDescription>
              Exigir código de verificação via WhatsApp no login do master
            </CardDescription>
          </div>
          
          <Badge 
            variant={isEnabled ? 'default' : 'secondary'}
            className={isEnabled ? 'bg-emerald-500' : ''}
          >
            {isEnabled ? 'Ativado' : 'Desativado'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-500/20' : 'bg-muted'}`}>
              <Smartphone className={`h-5 w-5 ${isEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">Verificação via WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Enviar código de 4 dígitos a cada login
              </p>
            </div>
          </div>
          
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle2FA}
            />
          )}
        </div>

        {/* Configuração do telefone */}
        <div className="space-y-4">
          <Label htmlFor="phone_2fa" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Número do WhatsApp do Master
          </Label>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  +55
                </span>
                <Input
                  id="phone_2fa"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="pl-12"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este número receberá o código de verificação via WhatsApp
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleSavePhone}
              disabled={saving || !isPhoneValid()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>

        {/* Botão de teste */}
        {isPhoneValid() && (
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={handleTestCode}
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : testSent ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                  Código Enviado!
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Código de Teste
                </>
              )}
            </Button>
          </div>
        )}

        {/* Aviso de segurança */}
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <p className="font-medium mb-1">Importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>O código expira em 5 minutos</li>
                <li>Certifique-se de que o WhatsApp está ativo neste número</li>
                <li>O código será enviado via X-Alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
