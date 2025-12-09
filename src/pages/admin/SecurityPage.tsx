import React from 'react';
import { Shield, Lock, Key, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[hsl(var(--exa-red))]/10 rounded-lg">
              <Shield className="h-6 w-6 text-[hsl(var(--exa-red))]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Segurança</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Gerencie configurações de segurança e acesso ao sistema
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Usuários Ativos</span>
              </div>
              <p className="text-2xl font-bold">24</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Sessões Seguras</span>
              </div>
              <p className="text-2xl font-bold">18</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">2FA Ativado</span>
              </div>
              <p className="text-2xl font-bold">12</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Tentativas Bloqueadas</span>
              </div>
              <p className="text-2xl font-bold">3</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Status de Segurança
              </CardTitle>
              <CardDescription>
                Visão geral da segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm">Criptografia de dados</span>
                <Badge className="bg-green-500">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm">SSL/TLS</span>
                <Badge className="bg-green-500">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm">Backup automático</span>
                <Badge className="bg-green-500">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm">Autenticação em dois fatores</span>
                <Badge className="bg-amber-500">Parcial</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alertas Recentes
              </CardTitle>
              <CardDescription>
                Atividades suspeitas detectadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Tentativa de login</span>
                    <span className="text-xs text-muted-foreground">Há 2h</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    3 tentativas falhas de IP 192.168.1.100
                  </p>
                </div>
                <div className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Novo dispositivo</span>
                    <span className="text-xs text-muted-foreground">Há 5h</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Login de novo dispositivo detectado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
