

# Plano: Corrigir Perfil do Anunciante — 4 Problemas

## Problemas

1. **Avatar header corrompido** — O card de resumo (linha 249-254) usa `settings.avatar_url` diretamente como `src`, mas essa URL é do bucket privado `arquivos` e precisa de signed URL. Resultado: imagem quebrada.

2. **WhatsApp verificado no cadastro aparece como "não verificado"** — A leitura de `telefone_verificado` na linha 107 depende de `userData` existir. Se o campo veio `null` por algum motivo (race condition, campo não salvo), `phoneVerified` fica `false`.

3. **Falta botão de consulta CNPJ** — O `useCNPJConsult` existe e funciona em propostas/contratos, mas não está integrado no `CompanyBrandSection`.

4. **Falta controle de tamanho da logo** — Não existe slider para ajustar a escala da logo em tempo real (preview para o cliente).

## Solução

### 1. Avatar header — usar signed URL (AdvertiserSettings.tsx)

No card de resumo (linhas 246-261), usar o hook `useLogoImageUrl` para resolver a URL do avatar privado, igual ao `CompanyBrandSection` já faz. Substituir o `src` direto por `resolvedAvatarUrl`.

```tsx
import { useLogoImageUrl } from '@/hooks/useLogoImageUrl';
// ...
const { imageUrl: resolvedAvatarUrl } = useLogoImageUrl(
  settings.avatar_url ? { file_url: settings.avatar_url, storage_bucket: 'arquivos' } : null
);
// No JSX:
{resolvedAvatarUrl ? <img src={resolvedAvatarUrl} .../> : <User .../>}
```

### 2. WhatsApp — garantir leitura correta (AdvertiserSettings.tsx)

Na linha 107, o `phoneVerified` já lê `userData?.telefone_verificado`. O problema é que se `userData` for `null` (erro PGRST116 silenciado na linha 85), o estado fica `false`. Adicionar fallback explícito e log:

```tsx
setPhoneVerified(userData?.telefone_verificado === true);
```

Isso já está correto. O problema real é que o campo `telefone_verificado` não foi persistido no cadastro (corrigido no commit anterior com retry). Para contas existentes que verificaram antes do fix, adicionar uma verificação extra: se `userData?.telefone_verificado_at` existir, considerar verificado.

```tsx
setPhoneVerified(userData?.telefone_verificado === true || !!userData?.telefone_verificado_at);
```

### 3. Botão consulta CNPJ (CompanyBrandSection.tsx)

Ao lado do campo CNPJ (linha 306-315), quando `isEditing && companyCountry === 'BR'`, adicionar botão "Consultar CNPJ" que:
- Usa `useCNPJConsult` para buscar dados
- Preenche automaticamente: `companyName` (razaoSocial/nomeFantasia), `companyAddress`, `businessSegment`

```tsx
import { useCNPJConsult } from '@/hooks/useCNPJConsult';
// ...
const { consultCNPJ, isLoading: isLoadingCNPJ } = useCNPJConsult();

const handleConsultCNPJ = async () => {
  const data = await consultCNPJ(companyDocument);
  if (data) {
    if (data.nomeFantasia) setCompanyName(data.nomeFantasia);
    else if (data.razaoSocial) setCompanyName(data.razaoSocial);
    if (data.endereco) setCompanyAddress(data.endereco);
    if (data.segmento) setBusinessSegment(data.segmento);
  }
};
```

Botão renderizado ao lado do input de CNPJ:
```tsx
<div className="flex gap-2">
  <Input ... className="flex-1" />
  {isEditing && companyCountry === 'BR' && (
    <Button variant="outline" onClick={handleConsultCNPJ} disabled={isLoadingCNPJ || companyDocument.replace(/\D/g,'').length !== 14}>
      {isLoadingCNPJ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      Consultar
    </Button>
  )}
</div>
```

### 4. Controle de tamanho da logo (CompanyBrandSection.tsx)

Adicionar um slider (Radix `Slider`) abaixo do preview da logo que controla a escala (`logoScale` state, default 1, range 0.5-1.5). O valor é salvo na tabela `users` em um campo `logo_scale` (novo campo, tipo `numeric`, default 1). O preview aplica `transform: scale(logoScale)` em tempo real.

**Porém**, adicionar uma coluna nova requer migration. Alternativa mais simples: salvar o scale como parte de `user_metadata` via `supabase.auth.updateUser({ data: { logo_scale } })`, sem precisar de migration.

- State: `const [logoScale, setLogoScale] = useState(1);`
- Carregar de `user_metadata.logo_scale` ou default 1
- Slider: `<Slider value={[logoScale]} onValueChange={([v]) => setLogoScale(v)} min={0.5} max={1.5} step={0.05} />`
- Preview: `<img style={{ transform: \`scale(\${logoScale})\` }} .../>`
- Salvar: no `handleSave` ou on blur do slider, chamar `supabase.auth.updateUser({ data: { logo_scale: logoScale } })`

## Arquivos Alterados (2)

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/advertiser/AdvertiserSettings.tsx` | Signed URL para avatar header + fallback `telefone_verificado_at` |
| `src/components/settings/CompanyBrandSection.tsx` | Botão consulta CNPJ + slider de tamanho da logo |

## Garantias
- Nenhum outro componente alterado
- Paleta azul do info box (linha 190-195) será trocada para stone/neutral (consistência EXA)
- Lógica existente de upload/save da logo preservada
- `useCNPJConsult` reutilizado sem modificação

