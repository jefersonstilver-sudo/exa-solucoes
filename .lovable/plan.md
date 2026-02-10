

# Corrigir Upload de Logos, Resetar Escalas e Garantir Link Funcional

## Problemas identificados

### 1. Upload diz "nenhum arquivo selecionado"
O `<input>` usa `accept=".png"` que em alguns navegadores rejeita arquivos PNG silenciosamente (especialmente se o MIME type do SO nao bate). Alem disso, o `handleFileUpload` recebe `e.target.files || []` -- quando `files` e `null` (nenhum arquivo passou o filtro do accept), passa array vazio e cai no `if (fileArray.length === 0) return` sem feedback. O input tambem nao e resetado antes de reabrir, entao selecionar o mesmo arquivo nao dispara `onChange`.

**Correcao:**
- Mudar `accept` para `accept="image/png,.png"` (aceita tanto por MIME quanto por extensao)
- Resetar o valor do input antes de abrir o seletor (`fileInputRef.current.value = ''`)
- Adicionar toast de erro quando nenhum arquivo valido e selecionado

### 2. Zoom travando em ~200% (database constraint)
Apesar do codigo frontend permitir ate 400%, a constraint do banco **nao foi aplicada corretamente** ou houve erro na migracao anterior. Vou criar uma nova migracao mais robusta com `IF EXISTS` para garantir que o limite seja 4.0.

### 3. Resetar TODAS as logos para scale_factor = 1.0
O usuario quer recalibrar tudo do zero. Vou criar uma migracao SQL que reseta `scale_factor = 1.0` em todas as logos.

### 4. Link em cada logo -- ja funciona mas precisa ser mais visivel
O campo `link_url` ja existe no banco e no formulario de edicao. O `TickerLogoItem` ja abre o link em nova aba ao clicar. Porem:
- No admin, o link so aparece como um icone pequeno -- vou tornar mais visivel mostrando o dominio do link
- Garantir que o `useLogoFileReplace` tambem aceite 5MB (esta com 1MB ainda)

## Alteracoes

### Arquivo 1: `src/components/admin/LogosAdmin.tsx`
- Linha 345: `accept` de `.png` para `image/png,.png`
- Linha 353: resetar `fileInputRef.current.value = ''` antes de `click()`
- Linha 43-46: adicionar toast quando `fileArray.length === 0` apos validacao
- Linhas 499-512: mostrar o dominio do link_url abaixo do nome da logo para ficar mais claro

### Arquivo 2: `src/hooks/useLogoFileReplace.ts`
- Linha 20: aumentar limite de 1MB para 5MB (consistencia com o upload bulk)

### Arquivo 3: Migracao SQL
- Resetar `scale_factor = 1.0` em TODAS as logos
- Garantir constraint `scale_factor >= 0.1 AND scale_factor <= 4.0` (minimo 0.1 para mais flexibilidade)

## Arquivos modificados

1. **`src/components/admin/LogosAdmin.tsx`** -- fix upload, melhorar visibilidade do link
2. **`src/hooks/useLogoFileReplace.ts`** -- aumentar limite para 5MB
3. **Nova migracao SQL** -- reset scale_factor + constraint

Nenhuma outra funcionalidade sera alterada.

