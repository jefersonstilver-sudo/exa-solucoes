

# Plano: Substituir upload de logo por ClientLogoUploadModal

## Problema
O `CompanyBrandSection.tsx` usa um upload simples (input file direto), enquanto o módulo de propostas tem o `ClientLogoUploadModal` completo com 3 variantes: Original, Branco (CSS), e Otimizada (IA). O usuário quer o mesmo módulo.

## Solução

Reutilizar o `ClientLogoUploadModal` já existente em `src/components/admin/proposals/ClientLogoUploadModal.tsx` dentro do `CompanyBrandSection.tsx`.

### Mudanças em `CompanyBrandSection.tsx`

1. **Importar** `ClientLogoUploadModal` e adicionar estado `showLogoModal`
2. **Substituir** toda a lógica de upload manual (linhas 87-138: `handleLogoUpload`, `fileInputRef`, input file) pelo modal
3. **Manter** o preview com fundo vermelho e botão de remover (linhas 256-275) — já está correto
4. **Substituir** o botão "Enviar Logo" e a área de upload (linhas 303-326) por um botão que abre o `ClientLogoUploadModal`
5. **No callback `onLogoProcessed`**: salvar a URL retornada pelo modal na tabela `users.logo_url` (mesma lógica atual do `handleSave`, mas imediata)
6. **Remover** `fileInputRef`, `uploadingLogo`, `handleLogoUpload` (não mais necessários)
7. **Manter** `handleRemoveLogo` (ainda necessário para o botão X)

### O que NÃO muda
- `ClientLogoUploadModal.tsx` — intacto, reutilizado como está
- Nenhuma outra página ou componente
- Edge Function `process-client-logo` — intacta
- Preview com gradiente vermelho e toggle versão branca — mantido

### Arquivo

| Arquivo | Ação |
|---------|------|
| `src/components/settings/CompanyBrandSection.tsx` | Refatorar upload para usar `ClientLogoUploadModal` |

