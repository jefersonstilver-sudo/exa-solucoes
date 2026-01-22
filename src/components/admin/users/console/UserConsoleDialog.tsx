/**
 * UserConsoleDialog - Orquestrador do Console Administrativo Enterprise
 * 
 * Desktop: Dialog com Tabs horizontais
 * Mobile: Sheet fullscreen com Accordion expansível
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Shield,
  Eye,
  Clock,
  AlertTriangle,
  Crown,
  Building2,
  CheckCircle,
  Ban,
  Loader2
} from 'lucide-react';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useUserConsole } from '@/hooks/useUserConsole';
import { UserConsoleDialogProps } from '@/types/userConsoleTypes';
import { IdentityTab } from './IdentityTab';
import { AccessTab } from './AccessTab';
import { ScopeTab } from './ScopeTab';
import { AuditTab } from './AuditTab';
import { DangerZone } from './DangerZone';

export const UserConsoleDialog: React.FC<UserConsoleDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated
}) => {
  const { isMobile } = useAdvancedResponsive();
  const {
    // Estado
    selectedRole,
    selectedDepartamento,
    editData,
    setEditData,
    isSaving,
    isLoading,
    // Dados carregados
    departments,
    auditEntries,
    // Permissões e validações
    permissions,
    errors,
    // Preview de impacto
    impact,
    // Handlers
    handleRoleChange,
    handleDepartamentoChange,
    // Operações
    saveIdentity,
    saveAccessChanges,
    resendConfirmationEmail,
    toggleBlock,
    // Auditoria
    refetchAudit
  } = useUserConsole({ user, open, onUserUpdated });

  if (!user) return null;

  // Renderização do header do usuário
  const UserHeader = () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={(user.raw_user_meta_data as Record<string, unknown>)?.avatar_url as string | undefined} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {user.email.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold truncate">
            {user.nome || user.email}
          </h3>
          {permissions.isTargetCEO && (
            <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge user={user} />
          <RoleBadge role={selectedRole} />
        </div>
      </div>
    </div>
  );

  // Componentes auxiliares
  const StatusBadge = ({ user: u }: { user: typeof user }) => {
    if (u.is_blocked) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Ban className="h-3 w-3 mr-1" />
          Bloqueado
        </Badge>
      );
    }
    if (!u.email_confirmed_at) {
      return (
        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Email Pendente
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-0">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    );
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const config: Record<string, { label: string; className: string }> = {
      'super_admin': { 
        label: 'CEO / Diretoria', 
        className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
      },
      'admin': { 
        label: 'Coordenação', 
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
      },
      'admin_departamental': { 
        label: 'Admin Departamental', 
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' 
      }
    };
    const cfg = config[role] || config['admin_departamental'];
    return (
      <Badge variant="outline" className={`text-xs border-0 ${cfg.className}`}>
        {cfg.label}
      </Badge>
    );
  };

  // Conteúdo das abas
  const TabContent = {
    identity: (
      <IdentityTab
        user={user}
        onSave={saveIdentity}
        onResendEmail={resendConfirmationEmail}
        isSaving={isSaving}
      />
    ),
    access: (
      <AccessTab
        user={user}
        departments={departments}
        selectedRole={selectedRole}
        selectedDepartamento={selectedDepartamento}
        onRoleChange={handleRoleChange}
        onDepartamentoChange={handleDepartamentoChange}
        onSave={saveAccessChanges}
        canEdit={permissions.canEditRole}
        isSaving={isSaving}
        errors={errors}
        impact={impact}
      />
    ),
    scope: (
      <ScopeTab
        user={user}
        selectedRole={selectedRole}
        selectedDepartamento={selectedDepartamento}
        departments={departments}
      />
    ),
    audit: (
      <AuditTab
        userId={user.id}
        entries={auditEntries}
        isLoading={isLoading}
        onRefresh={refetchAudit}
      />
    )
  };

  // === MOBILE: Sheet com Accordion ===
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] p-0">
          <SheetHeader className="p-4 pb-2 border-b">
            <SheetTitle className="sr-only">Console do Usuário</SheetTitle>
            <SheetDescription className="sr-only">
              Gerencie as informações e permissões do usuário
            </SheetDescription>
            <UserHeader />
          </SheetHeader>

          <ScrollArea className="h-[calc(95vh-120px)]">
            <div className="p-4 space-y-4">
              <Accordion type="single" collapsible defaultValue="identity">
                {/* Identidade */}
                <AccordionItem value="identity">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">Identidade</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {TabContent.identity}
                  </AccordionContent>
                </AccordionItem>

                {/* Acesso */}
                <AccordionItem value="access">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">Acesso & Organização</span>
                      {impact && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                          Alterações pendentes
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {TabContent.access}
                  </AccordionContent>
                </AccordionItem>

                {/* Escopo */}
                <AccordionItem value="scope">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="font-medium">Escopo Operacional</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {TabContent.scope}
                  </AccordionContent>
                </AccordionItem>

                {/* Auditoria */}
                <AccordionItem value="audit">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Auditoria</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {TabContent.audit}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Separator />

              {/* Danger Zone */}
              <DangerZone
                user={user}
                canBlock={permissions.canBlock}
                canDelete={permissions.canDelete}
                isTargetCEO={permissions.isTargetCEO}
                onToggleBlock={toggleBlock}
                onUserUpdated={onUserUpdated}
                onClose={() => onOpenChange(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // === DESKTOP: Dialog com Tabs ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="sr-only">Console do Usuário</DialogTitle>
          <DialogDescription className="sr-only">
            Gerencie as informações e permissões do usuário
          </DialogDescription>
          <UserHeader />
        </DialogHeader>

        <Tabs defaultValue="identity" className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b px-6 h-12 bg-transparent">
            <TabsTrigger 
              value="identity" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <User className="h-4 w-4 mr-2" />
              Identidade
            </TabsTrigger>
            <TabsTrigger 
              value="access"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Shield className="h-4 w-4 mr-2" />
              Acesso
              {impact && (
                <span className="ml-2 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="scope"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Eye className="h-4 w-4 mr-2" />
              Escopo
            </TabsTrigger>
            <TabsTrigger 
              value="audit"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Clock className="h-4 w-4 mr-2" />
              Auditoria
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <div className="p-6">
              <TabsContent value="identity" className="mt-0">
                {TabContent.identity}
              </TabsContent>

              <TabsContent value="access" className="mt-0">
                {TabContent.access}
              </TabsContent>

              <TabsContent value="scope" className="mt-0">
                {TabContent.scope}
              </TabsContent>

              <TabsContent value="audit" className="mt-0">
                {TabContent.audit}
              </TabsContent>

              <Separator className="my-6" />

              {/* Danger Zone */}
              <DangerZone
                user={user}
                canBlock={permissions.canBlock}
                canDelete={permissions.canDelete}
                isTargetCEO={permissions.isTargetCEO}
                onToggleBlock={toggleBlock}
                onUserUpdated={onUserUpdated}
                onClose={() => onOpenChange(false)}
              />
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserConsoleDialog;
