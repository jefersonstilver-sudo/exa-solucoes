# Guia de Integração - Sistema de Rastreamento de Comportamento

## 📊 Visão Geral

Sistema completo para rastrear e analisar o comportamento dos usuários no site, capturando:
- Páginas visitadas e tempo em cada uma
- Buscas realizadas (termos e filtros)
- Prédios clicados
- Cliques em pins do mapa
- Ações no carrinho (adicionar/remover)
- Início e conclusão de checkout
- Reprodução de vídeos
- Cliques em botões

## 🗄️ Estrutura do Banco de Dados

**Tabela:** `user_behavior_tracking`

Campos principais:
- `user_id`: ID do usuário (pode ser NULL para visitantes anônimos)
- `session_id`: ID único da sessão
- `event_type`: Tipo do evento ('page_view', 'search', 'building_click', etc.)
- `event_data`: Dados JSON específicos do evento
- `time_spent_seconds`: Tempo gasto (para page_view)
- `device_info`: Informações do dispositivo
- `created_at`: Timestamp do evento

## 🎯 Como Integrar

### 1. Rastreamento Automático de Páginas

Adicione no componente raiz ou em cada página principal:

\`\`\`typescript
import { usePageTracking } from '@/hooks/usePageTracking';

function MyPage() {
  // Rastreia automaticamente visualizações de página e tempo gasto
  usePageTracking();
  
  return <div>...</div>;
}
\`\`\`

### 2. Rastreamento Manual de Eventos

Para eventos específicos, use o hook `useBehaviorTracking`:

\`\`\`typescript
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';

function SearchComponent() {
  const { trackSearch } = useBehaviorTracking();
  
  const handleSearch = (term: string) => {
    trackSearch(term, { filters: {...} });
  };
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
\`\`\`

### 3. Exemplos de Integração por Componente

#### 🗺️ Mapa (Clique em Pin)

\`\`\`typescript
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';

function MapComponent() {
  const { trackMapPinClick } = useBehaviorTracking();
  
  const handleMarkerClick = (building) => {
    trackMapPinClick({
      id: building.id,
      nome: building.nome,
      bairro: building.bairro,
      latitude: building.latitude,
      longitude: building.longitude,
    });
  };
}
\`\`\`

#### 🏢 Lista de Prédios (Clique em Card)

\`\`\`typescript
const { trackBuildingClick } = useBehaviorTracking();

<BuildingCard 
  onClick={() => trackBuildingClick({
    id: building.id,
    nome: building.nome,
    bairro: building.bairro,
    endereco: building.endereco,
  })}
/>
\`\`\`

#### 🔍 Busca

\`\`\`typescript
const { trackSearch } = useBehaviorTracking();

const handleSearch = (term: string) => {
  trackSearch(term, {
    filters: {
      bairro: selectedBairro,
      precoMin: minPrice,
      precoMax: maxPrice,
    }
  });
};
\`\`\`

#### 🛒 Carrinho

\`\`\`typescript
const { trackCartAdd, trackCartRemove } = useBehaviorTracking();

// Ao adicionar
const addToCart = (building) => {
  trackCartAdd(building.id, building.nome, building.preco);
  // ... lógica do carrinho
};

// Ao remover
const removeFromCart = (buildingId) => {
  trackCartRemove(buildingId);
  // ... lógica do carrinho
};
\`\`\`

#### 💳 Checkout

\`\`\`typescript
const { trackCheckoutStart, trackCheckoutComplete } = useBehaviorTracking();

// Ao iniciar checkout
const startCheckout = () => {
  trackCheckoutStart(cartItems, totalValue);
};

// Ao finalizar pedido
const completeOrder = (orderId) => {
  trackCheckoutComplete(orderId, totalValue);
};
\`\`\`

#### 📹 Vídeos

\`\`\`typescript
const { trackVideoPlay } = useBehaviorTracking();

<video 
  onPlay={() => trackVideoPlay(videoUrl, 'home-page')}
/>
\`\`\`

#### 🔘 Botões Importantes

\`\`\`typescript
const { trackButtonClick } = useBehaviorTracking();

<button 
  onClick={() => {
    trackButtonClick('whatsapp-contact', 'building-details');
    // ... ação do botão
  }}
>
  Contatar via WhatsApp
</button>
\`\`\`

## 📈 Visualização dos Dados

### No Modal de Rastreabilidade (Admin)

Os dados são automaticamente exibidos quando um admin abre o modal de rastreabilidade de um cliente em "aguardando pagamento".

**Seções do Modal:**
1. **Navegação no Site**: Total de sessões, eventos e páginas
2. **Tempo por Página**: Páginas mais visitadas com tempo médio
3. **Buscas Realizadas**: Histórico de termos pesquisados
4. **Prédios Clicados**: Lista de prédios que despertaram interesse
5. **Cliques no Mapa**: Interações com pins do mapa
6. **Histórico do Carrinho**: Ações de adicionar/remover itens

### Consulta Direta no Banco

\`\`\`sql
-- Buscar resumo de um usuário
SELECT * FROM get_user_behavior_summary('user-id-aqui');

-- Buscar eventos brutos
SELECT * FROM user_behavior_tracking 
WHERE user_id = 'user-id-aqui' 
ORDER BY created_at DESC 
LIMIT 50;
\`\`\`

## 🎯 Locais Prioritários para Integração

1. **✅ ALTA PRIORIDADE**
   - [x] Página Home (`/`)
   - [ ] Loja/Mapa (`/loja`)
   - [ ] Detalhes do Prédio (`/building/:id`)
   - [ ] Busca de endereços
   - [ ] Carrinho de compras
   - [ ] Checkout

2. **✅ MÉDIA PRIORIDADE**
   - [ ] Quem Somos (`/quem-somos`)
   - [ ] Sou Síndico (`/sou-sindico`)
   - [ ] Página de Contato

3. **✅ BAIXA PRIORIDADE**
   - [ ] FAQ
   - [ ] Termos de Uso
   - [ ] Política de Privacidade

## 📝 Tipos de Eventos Suportados

| Event Type | Descrição | Dados Capturados |
|-----------|-----------|------------------|
| `page_view` | Visualização de página | URL, título, tempo gasto |
| `search` | Busca realizada | Termo, filtros aplicados |
| `building_click` | Clique em prédio | ID, nome, bairro, endereço |
| `map_pin_click` | Clique em pin do mapa | ID, nome, coordenadas |
| `cart_add` | Adicionar ao carrinho | ID, nome, preço |
| `cart_remove` | Remover do carrinho | ID |
| `checkout_start` | Início do checkout | Itens, valor total |
| `checkout_complete` | Pedido finalizado | ID do pedido, valor |
| `video_play` | Reprodução de vídeo | URL, origem |
| `button_click` | Clique em botão | Nome, localização |

## 🔒 Privacidade e LGPD

- ✅ Suporta usuários anônimos (sem `user_id`)
- ✅ Não captura dados sensíveis por padrão
- ✅ RLS configurado (admins veem tudo, usuários não veem dados de outros)
- ⚠️ Revisar conformidade com LGPD antes do lançamento

## 🚀 Performance

- Inserções assíncronas (não bloqueiam UI)
- Logs de erro não afetam experiência do usuário
- Índices otimizados para queries rápidas
- Session ID armazenado em sessionStorage

## 🐛 Debug

Para ver logs de tracking no console:

\`\`\`typescript
// Os eventos são automaticamente logados com:
console.log('✅ Evento rastreado:', eventType, eventData);
\`\`\`

## 📚 Referências

- Hook principal: `src/hooks/useBehaviorTracking.ts`
- Hook de página: `src/hooks/usePageTracking.ts`
- Serviço de dados: `src/services/behaviorTrackingService.ts`
- Modal de visualização: `src/components/admin/crm/ClientTrackingModal.tsx`
- Tabela: `public.user_behavior_tracking`
- Função SQL: `get_user_behavior_summary(user_id)`
