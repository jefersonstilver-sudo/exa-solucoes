

# Plano: Formulário Público `/interessesindico/formulario` — Etapas 1, 2 e 3 (placeholder)

## Verificações concluídas

- ✅ `react-hook-form@7.53`, `zod@3.23`, `@hookform/resolvers@3.9`, `zustand@5.0`, `@types/google.maps`, `framer-motion@12` — todos instalados.
- ✅ `src/utils/googleMapsLoader.ts` já existe e carrega `places` library com chave restrita ao domínio (mesma usada em `useGooglePlacesAutocomplete.tsx`). **Vou reutilizá-lo** em vez de pedir nova `VITE_GOOGLE_MAPS_API_KEY` — consistente com o resto do projeto e evita chave duplicada.
- ✅ Hook `useGooglePlacesAutocomplete` já existe e funciona com debounce + locationBias Foz. Vou estendê-lo (sem alterar) para extrair `address_components` no `getPlaceDetails`.
- ✅ Tabela `sindicos_interessados` tem trigger `validate_sindico_lead` (E.164 obrigatório) e `sync_sindico_legado` — confirmado nos prompts anteriores.

## Mudança de banco (única)

Migration:
```sql
ALTER TABLE public.sindicos_interessados
ADD COLUMN IF NOT EXISTS elevador_casa_maquinas text
CHECK (elevador_casa_maquinas IN ('sim','nao','nao_sei'));
```
Sem default, nullable (registros antigos preservados). Não toca em triggers.

## Estrutura de arquivos (toda nova, isolada)

```
src/pages/InteresseSindicoFormulario.tsx       ← page lazy-loaded
src/components/interesse-sindico-form/
├── schema.ts                ← schemas Zod por etapa + types
├── formStore.ts             ← zustand store (estado persistente entre etapas)
├── FormStepIndicator.tsx    ← progress bar 3 steps + animação
├── ChoiceCard.tsx           ← card reutilizável radio/checkbox (marker EXA red)
├── EnderecoAutocomplete.tsx ← Google Places + dropdown estilizado
├── MiniMapa.tsx             ← Map 160px com pin nas coords
├── CEPFallback.tsx          ← link expansível + busca viacep.com.br
├── UploadFotos.tsx          ← preview inline, máx 5×5MB (apenas client-side; upload real no Prompt 5)
├── StepPredio.tsx           ← Etapa 1
├── StepSindico.tsx          ← Etapa 2
├── StepTermosPlaceholder.tsx ← Etapa 3 visual apenas
└── styles.css               ← estilos específicos (slide horizontal, choice marker)

src/utils/phoneE164.ts       ← normalização BR → +5545999999999 + preview
src/utils/cpfValidator.ts    ← dígito verificador CPF (se já existir, reutilizo)
```

Rota adicionada em `src/routes/PublicRoutes.tsx`:
```tsx
const InteresseSindicoFormulario = React.lazy(() => import('@/pages/InteresseSindicoFormulario'));
<Route path="/interessesindico/formulario" element={<InteresseSindicoFormulario />} />
```

## Bibliotecas

- **Zero novas instalações.** Tudo já existe.
- Google Places: reutilizo `loadGoogleMaps()` + AutocompleteService + PlacesService (mesmo padrão de `useGooglePlacesAutocomplete`). Crio um hook novo `useEnderecoAutocomplete` interno na pasta do formulário com `getPlaceDetails` retornando `address_components` parseados.
- Mini-mapa: uso `google.maps.Map` + `google.maps.Marker` direto (sem `@vis.gl/react-google-maps` para evitar nova dep) — montado em ref `<div>` quando lat/lng disponíveis.

## Estado entre etapas

`zustand` store `useSindicoFormStore` com:
```ts
{
  step: 0 | 1 | 2,
  predio: { nomePredio, googlePlaceId, latitude, longitude, logradouro, numero, complemento, bairro, cidade, uf, cep, andares, blocos, unidades, elevadoresSociais, internetOps[], elevadorEmpresa, casaMaquinas },
  sindico: { nomeCompleto, cpf, whatsappRaw, whatsappE164, email, mandatoAte, fotos: File[] },
  setters / next() / prev() / reset()
}
```
Persistência em memória apenas (sem localStorage neste prompt — pode vir depois).

## Schemas Zod (resumo)

**stepPredioSchema:**
- `nomePredio`: string min 2 max 120
- `logradouro`: string min 3
- `numero`: string min 1 (obrigatório, mesmo se Google preencheu vazio)
- `complemento`: string optional
- `bairro/cidade`: string min 2; `uf`: string length 2; `cep`: regex `/^\d{5}-?\d{3}$/`
- `latitude/longitude`: number optional (preenchido por Google ou viacep)
- `googlePlaceId`: string optional
- `andares`: int min 2
- `blocos`: int min 1
- `unidades`: int min 1
- `elevadoresSociais`: int min 1
- `internetOps`: array enum `['vivo','ligga','telecom_foz']` min 1
- `elevadorEmpresa`: enum `['atlas','tke','otis','oriente']`
- `casaMaquinas`: enum `['sim','nao','nao_sei']`

**stepSindicoSchema:**
- `nomeCompleto`: string min 3 max 100, regex sem dígitos
- `cpf`: string com dígito verificador válido (algoritmo módulo 11)
- `whatsappRaw`: string que ao normalizar gera E.164 BR válido
- `whatsappE164`: regex `/^\+55\d{10,11}$/` (derivado, validado)
- `email`: z.string().email().max(255)
- `mandatoAte`: date ≥ hoje + 1 mês
- `fotos`: array File max 5, cada ≤ 5MB, mime `image/jpeg|image/png` (opcional)

**stepTermosSchema:** vazio neste prompt (apenas placeholder).

## Normalização WhatsApp → E.164

`src/utils/phoneE164.ts`:
- `normalizeBRPhoneToE164(input: string): string | null`
  - Remove tudo não-dígito.
  - Se começa com `55` e tem 12-13 dígitos → `+` + dígitos.
  - Se tem 10-11 dígitos (DDD + número) → `+55` + dígitos.
  - Caso contrário → null (inválido).
- `formatBRPhoneMask(input: string): string` → `(45) 99999-9999`.
- Componente Input mostra máscara visual + texto auxiliar abaixo: `Salvo como: +5545999999999` (cinza claro) atualizado em tempo real via `onChange`.

## Google Places — fluxo

1. Input digita → debounce 300ms → `AutocompleteService.getPlacePredictions` com `componentRestrictions:{country:'br'}`, `types:['address']`, `locationBias` Foz (raio 50km — já no helper).
2. Dropdown render: cada item com `<MapPin className="text-[var(--exa-red)]" />` + main_text negrito + secondary_text muted. Tap target 44px.
3. Click → `PlacesService.getDetails` com fields `['address_components','geometry','place_id','formatted_address']`.
4. Parser local extrai: route→logradouro, street_number→numero, sublocality_level_1→bairro, administrative_area_level_2→cidade, administrative_area_level_1→uf, postal_code→cep, geometry.location→lat/lng.
5. Store recebe valores; campos editáveis abaixo refletem (controlled inputs vinculados ao store).
6. MiniMapa monta com lat/lng, pin EXA red.

## CEP fallback

- Link "Prefere digitar o CEP?" → expande `<Collapsible>` com input CEP + botão "Buscar".
- Fetch `https://viacep.com.br/ws/{cep}/json/` (público, sem auth).
- Resposta preenche logradouro/bairro/cidade/uf no store. CEP não retorna lat/lng → MiniMapa fica oculto neste caminho (ou mostra mensagem "Posição aproximada não disponível"). Numero permanece manual.

## UI / Animação

- `framer-motion` `AnimatePresence` com `mode="wait"` + slide horizontal (x: ±40, opacity).
- Progress bar: 3 dots + linha de progresso (0% / 50% / 100%) com gradient `linear-gradient(90deg, var(--exa-red), var(--exa-bordo))`, `transition: 0.45s ease`.
- ChoiceCard: border 1px → on selected `border-[var(--exa-red)] bg-[var(--exa-glow)]` + `Check` icon vermelho topo-direito. Tap target ≥56px.
- Tema: reaproveita `.exa-theme` da landing (já global).

## Acessibilidade

- Todos inputs com `aria-label` + `<label htmlFor>`.
- Mensagens de erro `<p role="alert" aria-live="polite">`.
- Focus ring: `focus-visible:ring-2 focus-visible:ring-[var(--exa-red)]`.
- Botão "Continuar" com `disabled` quando schema da etapa atual falha; aria-disabled verdadeiro.

## Submit (NÃO neste prompt)

Etapa 3 = placeholder visual:
- Caixa scrollável com texto "Termos completos serão disponibilizados em breve."
- Checkbox desabilitado "Li e aceito os termos"
- Botão "Enviar cadastro" desabilitado
- Texto pequeno: "Esta etapa será ativada na próxima atualização."

Nenhuma chamada Supabase é feita. Upload de fotos apenas mantém File[] em memória + preview local via `URL.createObjectURL`.

## Garantias

- ✅ Não altero landing `/interessesindico` nem `/sou-sindico`.
- ✅ Não toco em triggers nem RLS — apenas ADD COLUMN.
- ✅ Não implemento submit nem termos reais nem PDF nem Z-API.
- ✅ Não altero variáveis CSS `--exa-*` nem `googleMapsLoader.ts`.
- ✅ Sem novas dependências npm.
- ✅ Toda lógica isolada em `src/components/interesse-sindico-form/`.

## Resumo de entregáveis

| # | Tipo | Item |
|---|---|---|
| 1 | Migration | `ALTER TABLE … ADD COLUMN elevador_casa_maquinas` |
| 2 | Page | `InteresseSindicoFormulario.tsx` |
| 3 | Componentes | 11 arquivos em `interesse-sindico-form/` |
| 4 | Utils | `phoneE164.ts`, `cpfValidator.ts` |
| 5 | Rota | `/interessesindico/formulario` em `PublicRoutes.tsx` |

Aguardando aprovação para executar.

