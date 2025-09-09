# Sistema de Carregamento EXA

Sistema completo de loading pages e transições para uma experiência de usuário premium.

## Componentes Principais

### 1. `GlobalLoadingPage`
Página de carregamento principal com logo EXA e animações elegantes.

```tsx
import { GlobalLoadingPage } from '@/components/loading';

<GlobalLoadingPage 
  message="Carregando aplicação..."
  showProgress={true}
  progress={75}
/>
```

**Características:**
- Fundo roxo gradiente (tema EXA)
- Logo EXA com rotação suave
- Partículas decorativas animadas
- Barra de progresso opcional
- Mensagens contextuais

### 2. `PageTransitionLoader`
Sistema de transições entre páginas.

```tsx
import { PageTransitionLoader } from '@/components/loading';

<PageTransitionLoader 
  isLoading={isTransitioning} 
  loadingMessage="Carregando página..."
>
  {children}
</PageTransitionLoader>
```

**Características:**
- Transições suaves entre rotas
- Mini logo durante transição
- Overlay semi-transparente
- Animações de entrada/saída

### 3. `EnhancedLoadingSpinner`
Spinner melhorado para componentes individuais.

```tsx
import { EnhancedLoadingSpinner } from '@/components/loading';

<EnhancedLoadingSpinner 
  size="lg"
  variant="primary"
  showText={true}
  text="Carregando dados..."
/>
```

**Variantes:**
- `primary`: Cores do tema principal
- `white`: Para fundos escuros
- `minimal`: Cores neutras

**Tamanhos:**
- `sm`: 16px
- `md`: 32px
- `lg`: 48px
- `xl`: 64px

## Hooks

### `usePageTransition`
Hook para controlar transições entre páginas.

```tsx
import { usePageTransition } from '@/hooks/usePageTransition';

const { isLoading, loadingMessage, setIsLoading } = usePageTransition({
  minLoadingTime: 300,
  transitionDelay: 50
});
```

**Configurações:**
- `minLoadingTime`: Tempo mínimo de exibição (UX)
- `transitionDelay`: Delay antes da transição

**Mensagens Automáticas por Rota:**
- `/loja` → "Carregando loja..."
- `/checkout/*` → "Preparando checkout..."
- `/payment` → "Processando pagamento..."
- E mais...

### `useLoadingState`
Estado global de carregamento (Zustand).

```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

const { 
  isGlobalLoading, 
  setGlobalLoading, 
  setLoadingProgress 
} = useLoadingState();

// Ativar loading global
setGlobalLoading(true, "Sincronizando dados...");

// Mostrar progresso
setLoadingProgress(50, true);
```

## Integração

### App.tsx
O sistema está integrado no `App.tsx` principal:

```tsx
// Hooks são chamados no AppContent
const { isLoading, loadingMessage } = usePageTransition();
const { isGlobalLoading, ... } = useLoadingState();

// Loading global tem prioridade
if (isGlobalLoading) {
  return <GlobalLoadingPage ... />;
}

// Transições entre páginas
return (
  <PageTransitionLoader isLoading={isLoading} ...>
    <Routes>...</Routes>
  </PageTransitionLoader>
);
```

### Lazy Loading
Todos os componentes com lazy loading usam `GlobalLoadingPage`:

```tsx
<Suspense fallback={<GlobalLoadingPage message="Carregando componente..." />}>
  <LazyComponent />
</Suspense>
```

## Componentes Atualizados

### Componentes Refatorados
- `MinimalLoader` → Usa `GlobalLoadingPage`
- `LazyLoadingFallback` → Usa `GlobalLoadingPage`  
- `PlanLoadingIndicator` → Usa `EnhancedLoadingSpinner`
- `PaymentLoading` → Usa `EnhancedLoadingSpinner`
- `PixPaymentLoading` → Melhorado com animações
- `LoadingOverlay` → Usa `EnhancedLoadingSpinner`
- `BuildingsPageLoader` → Usa `EnhancedLoadingSpinner`

### Funcionalidade Preservada
✅ Todas as funcionalidades existentes mantidas
✅ Mesmas props e comportamentos
✅ Compatibilidade com componentes existentes
✅ Rotas e navegação inalteradas

## Melhorias de Responsividade

### CSS Responsivo
- Touch targets mínimos (44px) no mobile
- Tipografia responsiva escalável
- Containers otimizados por breakpoint
- Melhores estados de foco para acessibilidade

### Performance
- GPU acceleration para animações
- Will-change otimizado
- Scroll suave no mobile
- Prevenção de layout shift

### Design System
- Uso consistente de tokens CSS
- Suporte completo a dark/light mode
- Cores HSL padronizadas
- Animações suaves e otimizadas

## Como Usar

### Para Loading Global
```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

const handleAsyncOperation = async () => {
  const { setGlobalLoading } = useLoadingState();
  
  setGlobalLoading(true, "Processando dados...");
  
  try {
    await someAsyncOperation();
  } finally {
    setGlobalLoading(false);
  }
};
```

### Para Componentes Individuais
```tsx
import { EnhancedLoadingSpinner } from '@/components/loading';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  
  if (loading) {
    return (
      <EnhancedLoadingSpinner 
        size="md" 
        showText={true} 
        text="Carregando dados..."
      />
    );
  }
  
  return <div>Conteúdo carregado</div>;
};
```

## Personalização

### Cores
As cores seguem o design system em `index.css`:
- `--primary`: Cor principal (roxo EXA)
- `--background`: Fundo da aplicação
- `--foreground`: Texto principal
- `--muted`: Cores neutras

### Animações
Durações padrão:
- Transições rápidas: 200ms
- Transições médias: 300ms
- Transições longas: 500ms

### Breakpoints
- `sm`: 640px
- `md`: 768px  
- `lg`: 1024px
- `xl`: 1280px