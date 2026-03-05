

# Plano: Reestruturação Completa da Página de Configurações do Anunciante

## Resumo

Refatorar completamente `AdvertiserSettings.tsx` e `CompanyBrandSection.tsx` para criar uma experiência corporativa minimalista (Stripe/Linear/Apple Settings), com modo de edição bloqueado, estados visuais claros, botão voltar, e fluxo WhatsApp correto.

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/advertiser/AdvertiserSettings.tsx` | Reestruturação completa: header com voltar, modo edição bloqueado, seções reorganizadas, proteção contra perda de edição, estados loading granulares |
| `src/components/settings/CompanyBrandSection.tsx` | Card resumo institucional, modo leitura por padrão, botão "EU CONFIRMO" desabilitado após aceite |

## Mudanças Detalhadas

### 1. `AdvertiserSettings.tsx` — Reestruturação

**A. Botão Voltar + Header**
- Botão `← Voltar` no topo esquerdo com `onClick={() => window.history.back()}`, min-height 44px
- Header: "Configurações da Conta" + subtítulo "Gerencie as informações da sua empresa e integrações"
- Botão "Editar Configurações" no header que controla `isEditing` state

**B. Estado `isEditing` (modo leitura/edição)**
- `const [isEditing, setIsEditing] = useState(false)`
- `const [originalSettings, setOriginalSettings] = useState(...)` — snapshot para cancelar
- Todos os campos (nome, CPF, documento, notificações) iniciam `disabled={!isEditing}` com visual `bg-gray-50 border-transparent`
- Quando `isEditing`: campos editáveis, rodapé mostra "Salvar Alterações" + "Cancelar"
- "Cancelar" restaura `originalSettings` e `setIsEditing(false)`
- Remover o botão "Salvar Alterações" fixo no final (só aparece em modo edição)

**C. Proteção contra perda de edição**
- `useEffect` com `beforeunload` event quando `isEditing && hasChanges`

**D. Reorganização das seções**
Ordem final dos cards:
1. Resumo da Conta (avatar + nome + email — somente leitura)
2. Dados Pessoais (nome, WhatsApp, documentação — tudo dentro de um card)
3. Empresa/Marca (`CompanyBrandSection`)
4. Segurança (2FA + alterar senha + cancelamento)

Remover o card de Notificações vazio (linhas 361-365 — card sem conteúdo).

**E. WhatsApp — fluxo correto**
- Quando `phoneVerified = true`: mostrar "✔ WhatsApp conectado e verificado" + botão "Alterar Número" (abre modal completo de 4 etapas)
- Quando `phoneVerified = false`: mostrar "⚠ Número não verificado" + botão "Verificar" (abre o mesmo modal mas o título faz sentido porque é verificação inicial)
- O estado `phoneVerified` já é carregado do banco (`telefone_verificado`) no `loadUserSettings` — correto
- O `onSuccess` já persiste `telefone_verificado: true` — correto

**F. 2FA — visual simplificado**
- Manter toggle `AppleSwitch` existente
- Badge "Ativo" (verde) ou "Desativado" (cinza) ao lado do título
- Texto explicativo curto: "Protege sua conta com uma camada adicional de segurança"
- Se phone não verificado: mensagem amarela inline (já implementado, manter)

**G. Estados visuais padronizados**
- Verde (`bg-green-50 border-green-200`): Configurado/Validado/Verificado
- Amarelo (`bg-amber-50 border-amber-200`): Pendente
- Cinza (`bg-gray-50`): Bloqueado/Somente leitura

### 2. `CompanyBrandSection.tsx` — Card Resumo + Modo Leitura

**A. Card resumo institucional (topo)**
- Se `companyName && companyDocument && logoUrl` todos preenchidos: renderizar card resumo antes dos campos
- Layout: Logo (96px, fundo vermelho) à esquerda + Nome, Documento formatado, Segmento à direita
- Badges de status: ✔ Logo carregada, ✔ Documento validado, ✔ Termo confirmado (ou ⚠ Pendente)

**B. Modo leitura nos campos**
- Receber prop `isEditing` de `AdvertiserSettings`
- Campos (nome empresa, país, documento, segmento, endereço) iniciam `disabled={!isEditing}`
- Visual bloqueado: `bg-gray-50 border-transparent`

**C. Botão "EU CONFIRMO" — estado correto**
- Se `termsAccepted = true && termsAcceptedDate`: botão desabilitado, texto "✔ Confirmado", mostrar data abaixo
- Se `termsAccepted = false`: botão ativo normalmente
- O `CompanyTermsCheckbox` já recebe `disabled={termsAccepted}` — correto, manter

**D. Botão salvar da empresa**
- Só aparece quando `isEditing` (recebido via prop)

### 3. Nenhuma alteração em outros arquivos

- `WhatsAppVerificationModal.tsx` — intacto (fluxo de 4 etapas funciona)
- `CompanyTermsCheckbox.tsx` — intacto
- `ClientLogoUploadModal.tsx` — intacto
- Nenhuma tabela nova, nenhuma edge function alterada

