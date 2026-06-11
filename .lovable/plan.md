# Botão "Mapa" Premium na Nova Proposta

## Objetivo
Adicionar, na seção **"Locais Contratados"** da criação/edição de proposta, um botão minimalista **"Mapa"** que abre um overlay **glass fullscreen** com os mesmos pins da loja online, mostrando todos os prédios já selecionados na proposta. Padrão visual EXA Premium (Apple-like, glassmorphism, slate + EXA Red).

## Reuso
- `src/components/building-store/BuildingMap.tsx` — mapa real da loja (Google Maps via `loadGoogleMaps`, `CustomPinImage`, `BuildingHoverCard`, clustering, geocoding cache persistente). Aceita `buildings`, `autoFitAllBuildings`, `enableClustering`, `gestureHandling`, `hideDefaultControls`.
- `getPersistentGeocode` já preenche `lat/lng` que faltarem — sem fetch extra.
- Nenhum hook/loader novo de Google Maps.

## Arquivos

### Novo: `src/components/admin/proposals/ProposalMapDialog.tsx`
Overlay fullscreen com Radix Dialog (`DialogPortal` + `DialogOverlay` + `DialogContent`):

- **Container**: `fixed inset-0 z-[120] p-0 m-0 max-w-none w-screen h-[100dvh] rounded-none border-0 bg-transparent` (usa `100dvh` para iOS Safari sem cortar com a barra inferior).
- **Backdrop**: `bg-slate-950/55 backdrop-blur-2xl` com fade-in 250ms.
- **Mapa**: `<BuildingMap buildings={selectedBuildings} selectedLocation={null} autoFitAllBuildings enableClustering gestureHandling="greedy" defaultZoom={13} hideDefaultControls={false} />` ocupando `absolute inset-0`.
- **Header flutuante (topo)**:
  - Pílula glass: `absolute top-3 left-3 right-3 sm:top-5 sm:left-5 sm:right-5 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 shadow-2xl`.
  - Esquerda: ícone `MapPin` slate + título `Locais da Proposta` + badge contagem `N prédios` (`bg-[#C7141A]/10 text-[#C7141A]`).
  - Direita: botão fechar (ver abaixo).
  - Em mobile (`<sm`) o título encolhe para `Mapa · N` e ganha `truncate`.
- **Botão Fechar (X) — Premium**:
  - `Button` custom, `aria-label="Fechar mapa"`, `title="Fechar (ESC)"`.
  - Estilo: `inline-flex items-center justify-center h-11 w-11 sm:h-10 sm:w-10 rounded-full bg-white/85 dark:bg-slate-800/85 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/60 shadow-xl hover:shadow-2xl hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 text-slate-700 dark:text-slate-100`.
  - Ícone `X` da lucide (`size={20} strokeWidth={2.25}`).
  - Touch target ≥ 44px em mobile (h-11 w-11).
  - Fechamento por: clique no X, ESC, clique no backdrop fora do header.
  - Esconde o X nativo do `DialogContent` (`[&>button.absolute]:hidden`) para não duplicar.
- **Rodapé flutuante (opcional, mobile)**: pílula glass pequena `absolute bottom-4 left-1/2 -translate-x-1/2` com `N prédios mapeados` quando há marcadores, some após 3s — auxílio de orientação.
- **Estados**:
  - Vazio (`selectedBuildings.length === 0`): mensagem central glass "Selecione prédios para visualizar no mapa".
  - Loading do mapa: skeleton glass com spinner slate.
  - Erro de geocoding: toast existente, não trava o dialog.
- **Acessibilidade**: `role="dialog"`, foco inicial no botão X, foco trap nativo do Radix, restaura foco no botão "Mapa" ao fechar.
- **Animação**: enter `fade + scale-[0.98]→1` 220ms ease-out; exit espelhado.
- Props: `open: boolean`, `onOpenChange: (v: boolean) => void`, `buildings: BuildingStore[]`, `title?: string`.

### Edit: `src/pages/admin/proposals/NovaPropostaPage.tsx`
1. `import ProposalMapDialog from '@/components/admin/proposals/ProposalMapDialog'`.
2. `const [mapOpen, setMapOpen] = useState(false)`.
3. No header da seção "Locais Contratados", ao lado do contador atual, adicionar botão:
   - Ícone `MapPin` (lucide) + texto `Mapa`.
   - Estilo minimalista premium: `variant="outline" size="sm" className="gap-2 rounded-full border-slate-200 bg-white/80 backdrop-blur hover:bg-white hover:border-slate-300 hover:shadow-md transition-all text-slate-700 font-medium"`.
   - `disabled={selectedBuildings.length === 0}` com tooltip "Adicione prédios para ver no mapa".
   - Em mobile, esconder o label e manter só o ícone (`<span className="hidden sm:inline">Mapa</span>`); botão fica circular `h-9 w-9 sm:w-auto sm:px-3`.
4. Render condicional: `<ProposalMapDialog open={mapOpen} onOpenChange={setMapOpen} buildings={selectedBuildings} />`.
5. Fonte de `selectedBuildings`: reutilizar exatamente o array já enriquecido que alimenta a lista visual atual de prédios da proposta (mesma origem do contador). Não duplicar query.

## Responsividade (calibrada)
- **Mobile (≤640px)**: header em pílula com padding reduzido, título compacto, X 44×44, `gestureHandling="greedy"` (arrasto 1 dedo), `100dvh` para evitar corte da URL bar do Safari iOS.
- **Tablet (640–1024px)**: header com título completo, X 40×40, controles padrão do Google Maps visíveis.
- **Desktop (≥1024px)**: header centralizado com largura máxima, scroll-wheel zoom habilitado, hover cards dos pins ativos.
- **Dark mode**: tokens slate-900/70 já contemplados.
- **Safe-area iOS**: `pt-[env(safe-area-inset-top)]` no header, `pb-[env(safe-area-inset-bottom)]` no rodapé flutuante.

## Não-objetivos (não tocar)
- Cálculo de proposta, fidelidade, dias, valor manual, salvamento.
- Componente `BuildingMap` da loja (só consumir).
- Outras telas de proposta (lista, pública, detalhes, mobile card).
- Loader/secret do Google Maps.

## Validação
1. Abrir uma proposta com 3+ prédios e clicar em "Mapa" → overlay fullscreen com pins agrupados, `autoFit` enquadra todos.
2. Hover em pin → `BuildingHoverCard` aparece (mesma UX da loja).
3. ESC fecha. Clique no X fecha. Clique fora do header fecha. Foco volta ao botão "Mapa".
4. Mobile 375×812: header não vaza, X com 44px, arrasto com 1 dedo, sem barra branca inferior.
5. Estado vazio: botão fica disabled com tooltip.
6. Sem regressão visual ou de lógica em qualquer outro lugar da proposta.

## Resumo de arquivos
- **novo**: `src/components/admin/proposals/ProposalMapDialog.tsx`
- **edit**: `src/pages/admin/proposals/NovaPropostaPage.tsx`
