## Problemas identificados

### 1. Erro ao salvar prédio (`buildings_status_check`)
O `<SelectItem>` em `BuildingFormDialog3.tsx` envia os valores `"manutenção"` e `"instalação"` (com acento) para o banco, mas o constraint `buildings_status_check` espera valores sem acento (`"manutencao"`, `"instalacao"`). Isso causa o erro `new row for relation "buildings" violates check constraint`.

### 2. Bairro não preenchido automaticamente
Mesmo após selecionar um endereço completo via Google Places, o campo `Bairro` permanece vazio. O hook `useGooglePlacesAutocomplete` só pede `formatted_address`, `geometry`, `name` e `types` — não solicita `address_components`, que é onde o Google entrega o bairro (`sublocality_level_1` / `sublocality` / `neighborhood`).

---

## Plano de correção

### A) `src/components/admin/buildings/v3/BuildingFormDialog3.tsx`
- Trocar os `value` dos `<SelectItem>` de status para os canônicos do constraint:
  - `"manutenção"` → `"manutencao"`
  - `"instalação"` → `"instalacao"`
  - Labels visíveis continuam com acento (Manutenção / Instalação).
- No `onPlaceSelect` do `<AddressAutocomplete>`, passar a usar o novo campo `neighborhood` retornado e, **só preencher o bairro se ele ainda estiver vazio** (não sobrescrever edição manual do usuário):
  ```ts
  if (place.neighborhood && !formData.bairro) {
    updateField('bairro', place.neighborhood);
  }
  ```

### B) `src/hooks/useGooglePlacesAutocomplete.tsx`
- Adicionar `'address_components'` ao array `fields` do `PlaceDetailsRequest` em `getPlaceDetails`. Sem isso, o Google não devolve o bairro.

### C) `src/components/ui/address-autocomplete.tsx`
- Estender o callback `onPlaceSelect` com um campo opcional `neighborhood?: string`.
- Após receber `placeDetails`, varrer `placeDetails.address_components` na ordem de prioridade:
  1. `sublocality_level_1`
  2. `sublocality`
  3. `neighborhood`
  4. (fallback) `administrative_area_level_4` / `administrative_area_level_3`
- Repassar o `long_name` encontrado em `onPlaceSelect({ ..., neighborhood })`.

### Garantias
- **Não altero** UI, layout, estilos, fluxos ou qualquer outro comportamento fora dos pontos acima — segue a regra do projeto.
- Bairro digitado manualmente pelo usuário **não** é sobrescrito.
- Mudanças são puramente locais ao formulário e ao hook de autocomplete; nenhum schema/migration necessário (o constraint do banco já está correto, o frontend é que estava enviando valor errado).

### Arquivos a editar
- `src/components/admin/buildings/v3/BuildingFormDialog3.tsx`
- `src/hooks/useGooglePlacesAutocomplete.tsx`
- `src/components/ui/address-autocomplete.tsx`
