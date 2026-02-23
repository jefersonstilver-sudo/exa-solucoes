
# Adicionar Logo da Empresa nos Cards de Propostas

## Problema
Os cards de propostas na listagem nao exibem a logo da empresa, mesmo quando a proposta ja tem `client_logo_url` configurada. O card vai direto do checkbox para o conteudo textual, sem nenhum indicador visual da empresa.

## Solucao

Adicionar um avatar compacto (32x32px) entre o checkbox e o conteudo do card, seguindo o padrao visual EXA (gradiente vermelho escuro + logo branca).

### Arquivo: `src/pages/admin/proposals/PropostasPage.tsx`

Entre o bloco do checkbox (linha 1109) e o bloco `{/* Content */}` (linha 1111), inserir um avatar:

- **Quando `client_logo_url` existe**: Exibir a logo com fundo gradiente (`from-[#9C1E1E] via-[#180A0A] to-[#0B0B0B]`) e filtro `brightness-0 invert` (logo branca), com signed URL gerada via `supabase.storage.createSignedUrl` para compatibilidade com bucket privado
- **Quando NAO existe**: Exibir as iniciais do `client_company_name` ou `client_name` sobre o mesmo fundo gradiente vermelho

### Detalhes tecnicos

1. Criar um sub-componente inline `ProposalLogoAvatar` que:
   - Recebe `logoUrl` e `name` como props
   - Gera signed URL se a logo for do Supabase Storage (reutilizando o padrao de `ClientLogoDisplay.tsx`)
   - Renderiza um `div` 32x32 com gradiente vermelho + imagem ou iniciais

2. Inserir o avatar na linha 1110 (entre checkbox e content):
```text
+------------------------------------------+
| [x] [LOGO] EXA-2026-7381 VERTICAL...    |
|            Daniel Ramos / Suzana...       |
|            12M • 17 predios • R$5.980    |
+------------------------------------------+
```

3. O campo `client_logo_url` ja esta disponivel pois a query usa `select('*')`

### Nenhuma alteracao de banco necessaria
O campo `client_logo_url` ja existe na tabela `proposals`.
