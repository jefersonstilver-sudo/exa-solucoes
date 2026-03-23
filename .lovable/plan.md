
Plano de auditoria e correção imediata do reset de senha

Diagnóstico confirmado do erro da screenshot
- O erro exibido agora é real e vem do Supabase Auth: `429 email rate limit exceeded` no endpoint `/recover`.
- Ou seja: nesta tentativa o pedido de reset nem chegou a falhar “dentro do email”; ele foi bloqueado antes, pelo limite anti-spam do próprio Supabase.
- Os logs confirmam várias tentativas seguidas para `comercial@examidia.com.br` em segundos/minutos próximos, todas com `status 429`.
- Por isso também não aparecem logs recentes do `unified-email-service`: nessas tentativas o hook de envio nem foi alcançado.

O que a auditoria encontrou no código
1. O cooldown atual não é global
- `DangerZone`, `PasswordResetForm`, `SecureAdminReset`, `ProfileSettings`, `ClientsSection` e `UserDetailsDialogComplete` já têm cooldown local.
- Mas esse cooldown vive só dentro do componente. Se o modal fecha, a tela troca, a página recarrega ou outro ponto da aplicação dispara reset, o bloqueio “some”.
- Resultado: o usuário consegue clicar de novo em outra tela e o Supabase responde 429.

2. Ainda existem pontos sem a proteção aplicada
- `src/components/sistema/ERPLoginForm.tsx`
- `src/hooks/useUserConsole.ts`
- `src/components/admin/orders/ProfessionalOrderReport.tsx`
- Esses fluxos ainda chamam `resetPasswordForEmail()` sem a mesma proteção robusta.

3. O fluxo do link de recuperação ainda é frágil
- `src/pages/ResetPassword.tsx` melhorou, mas ainda registra o listener `onAuthStateChange` depois de iniciar `getSession()`.
- Para recovery, isso é arriscado: o evento pode acontecer antes do listener estar ativo.
- Além disso, o timeout fixo de 5s ainda pode marcar o link como expirado cedo demais.

4. O hook customizado de email de recovery está montando a URL manualmente
- Em `supabase/functions/unified-email-service/index.ts`, o link de recovery é reconstruído manualmente.
- Isso é um ponto sensível e provavelmente explica os relatos de “clicar no link e não funcionar”.
- Para signup o código já tenta usar a URL oficial do payload; para recovery ele não faz o mesmo padrão seguro.

O que eu vou corrigir
1. Centralizar o reset de senha em um único fluxo compartilhado
- Criar um serviço/hook único para solicitar reset.
- Esse fluxo vai:
  - aplicar cooldown por email
  - persistir o tempo em storage local para sobreviver a troca de tela/modal
  - padronizar o tratamento de 429
  - evitar duplicação entre componentes

2. Migrar todos os pontos de disparo para o fluxo central
- Atualizar todos os chamadores de `resetPasswordForEmail`.
- Prioridade:
  1. `src/components/admin/users/console/DangerZone.tsx`
  2. `src/components/auth/PasswordResetForm.tsx`
  3. `src/components/admin/security/SecureAdminReset.tsx`
  4. `src/pages/ProfileSettings.tsx`
  5. `src/components/admin/users/ClientsSection.tsx`
  6. `src/components/admin/users/UserDetailsDialogComplete.tsx`
  7. `src/components/sistema/ERPLoginForm.tsx`
  8. `src/hooks/useUserConsole.ts`
  9. `src/components/admin/orders/ProfessionalOrderReport.tsx`

3. Corrigir o fluxo da página `/reset-password`
- Registrar `onAuthStateChange` antes de `getSession()`.
- Tratar corretamente `PASSWORD_RECOVERY` e `SIGNED_IN`.
- Evitar mostrar “Link expirado” só por timeout curto.
- Deixar a checagem baseada em sessão/token realmente válido.

4. Corrigir o link de recovery gerado pelo hook de email
- Revisar `supabase/functions/unified-email-service/index.ts`.
- Parar de depender de montagem manual frágil do link quando houver dado oficial disponível no payload.
- Garantir consistência total do `redirectTo` para `/reset-password`.
- Adicionar logs mínimos e úteis para recovery, para facilitar nova auditoria se algo ainda falhar.

5. Validar ponta a ponta após as correções
- Teste 1: admin envia reset uma vez e recebe confirmação sem 429.
- Teste 2: segundo clique imediato fica bloqueado no frontend.
- Teste 3: usuário clica no link e a tela de nova senha abre corretamente.
- Teste 4: senha é alterada com sucesso e o login volta a funcionar.
- Teste 5: fluxo ERP e fluxo administrativo ficam consistentes.

Arquivos previstos para alteração
- `src/utils/resetPasswordCooldown.ts`
- `src/components/admin/users/console/DangerZone.tsx`
- `src/components/auth/PasswordResetForm.tsx`
- `src/components/admin/security/SecureAdminReset.tsx`
- `src/pages/ProfileSettings.tsx`
- `src/components/admin/users/ClientsSection.tsx`
- `src/components/admin/users/UserDetailsDialogComplete.tsx`
- `src/components/sistema/ERPLoginForm.tsx`
- `src/hooks/useUserConsole.ts`
- `src/components/admin/orders/ProfessionalOrderReport.tsx`
- `src/pages/ResetPassword.tsx`
- `supabase/functions/unified-email-service/index.ts`

Resumo objetivo
- O erro da screenshot aconteceu porque o Supabase bloqueou novas tentativas com 429.
- Isso continuou acontecendo porque a proteção atual está fragmentada e não é compartilhada entre todas as telas.
- Além disso, o fluxo do link de recovery ainda tem dois pontos frágeis: a página `/reset-password` e a montagem manual do link no hook de email.
- A correção certa agora é tratar o problema como sistema completo, não só como botão isolado.
