## Problema

O switch "Tem Airbnb?" atualiza o estado do formulário, mas o `handleSubmit` em `src/components/admin/buildings/v3/BuildingFormDialog3.tsx` (linhas 245-270) constrói o `payload` enviado ao Supabase campo a campo — e **omite `tem_airbnb`**. Por isso o toast aparece como sucesso (o UPDATE roda), mas o campo nunca é salvo.

Verifiquei no banco: `Residencial Miró` está `tem_airbnb = false`, confirmando que nenhum salvamento chegou.

## Correção

1 alteração, 1 arquivo:

- `src/components/admin/buildings/v3/BuildingFormDialog3.tsx`: adicionar `tem_airbnb: Boolean((formData as any).tem_airbnb)` no objeto `payload` do `handleSubmit` (junto com os demais campos, antes de `amenities`).
- Garantir também que `tem_airbnb` exista no tipo `FormData` local do componente (se faltar) e no `initialFormData`, para o switch funcionar tipado sem `as any`.

Sem migrações, sem mudanças de RLS, sem mudanças em outros componentes. Após a correção, eu mesmo verifico via query no banco que o salvamento persistiu.
