# Sistema de Auditoria - Documentação Completa

## 📋 Visão Geral

O sistema de auditoria rastreia todas as ações administrativas realizadas no sistema, com foco especial em usuários com papel `admin_financeiro` (Administrador Financeiro).

## 🔐 Arquitetura de Segurança

### ⚠️ AVISO CRÍTICO DE SEGURANÇA

**O sistema atual armazena roles diretamente na tabela `users`**, o que pode ser vulnerável a ataques de escalação de privilégios. 

### Recomendação de Segurança
Migrar para uma tabela `user_roles` separada com políticas RLS:

```sql
-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'admin_marketing', 'admin_financeiro', 'super_admin', 'client');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função de segurança
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

## 👥 Roles do Sistema

### Super Admin (`super_admin`)
- Acesso total ao sistema
- Pode criar todos os tipos de usuários
- Acesso exclusivo ao painel de auditoria
- Pode visualizar logs de todos os usuários

### Administrador Financeiro (`admin_financeiro`)
**Permissões:**
- ✅ Visualizar todos os pedidos/vendas
- ✅ Gerenciar benefícios de prestadores
- ✅ Visualizar relatórios financeiros
- ✅ Exportar dados financeiros
- ❌ Não pode criar usuários
- ❌ Não pode gerenciar prédios/painéis
- ❌ Não pode gerenciar leads

**Todas as ações são auditadas automaticamente**

### Administrador Geral (`admin`)
- Gestão completa de prédios, painéis e pedidos
- Acesso a benefícios e relatórios financeiros
- Não pode criar usuários

### Administrador Marketing (`admin_marketing`)
- Gestão de leads, campanhas e conteúdo
- Não tem acesso a dados financeiros

## 📊 Sistema de Logs

### Estrutura da Tabela `user_activity_logs`

```typescript
interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;        // 'view', 'create', 'update', 'delete', 'export'
  entity_type: string | null; // 'order', 'benefit', 'report', etc.
  entity_id?: string | null;  // ID da entidade afetada
  action_description?: string | null; // Descrição detalhada
  metadata?: any;             // Dados adicionais (JSON)
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}
```

### Tipos de Ações Rastreadas

| Ação | Descrição | Exemplo |
|------|-----------|---------|
| `view` | Visualização de dados | Admin financeiro acessou lista de pedidos |
| `create` | Criação de novos registros | Admin financeiro criou novo benefício |
| `update` | Atualização de registros | Admin financeiro atualizou pedido #123 |
| `delete` | Exclusão de registros | Admin financeiro removeu benefício inativo |
| `export` | Exportação de dados | Admin financeiro exportou relatório financeiro |

## 🛠️ Como Usar

### 1. Hook `useActivityLogger`

```typescript
import { useActivityLogger } from '@/hooks/useActivityLogger';

function MyComponent() {
  const { logView, logCreate, logUpdate, logDelete, logExport } = useActivityLogger();
  
  const handleViewOrder = async (orderId: string) => {
    // Registra que o usuário visualizou um pedido
    await logView('order', orderId, { 
      order_number: '12345',
      amount: 1500.00 
    });
  };
  
  const handleCreateBenefit = async (benefit: any) => {
    // Cria o benefício
    const result = await createBenefitAPI(benefit);
    
    // Registra a criação
    await logCreate('benefit', result.id, {
      benefit_name: benefit.name,
      benefit_amount: benefit.amount
    });
  };
  
  const handleExportReport = async () => {
    // Gera o relatório
    const report = await generateFinancialReport();
    
    // Registra a exportação
    await logExport('financial_report', {
      report_type: 'monthly',
      period: '2025-01',
      records_count: report.length
    });
  };
}
```

### 2. Exemplo Completo - Página de Pedidos

```typescript
import React, { useEffect } from 'react';
import { useActivityLogger } from '@/hooks/useActivityLogger';

const OrdersPage = () => {
  const { logView, logExport } = useActivityLogger();
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    // Registra que o usuário acessou a página
    logView('orders_page', undefined, {
      page_name: 'Lista de Pedidos',
      filters_applied: {}
    });
    
    loadOrders();
  }, []);
  
  const handleExportOrders = async () => {
    const csvData = generateCSV(orders);
    
    // Registra a exportação
    await logExport('orders', {
      format: 'csv',
      total_orders: orders.length,
      date_range: { start: '2025-01-01', end: '2025-01-31' }
    });
    
    downloadCSV(csvData);
  };
  
  return (
    <div>
      <h1>Pedidos</h1>
      <button onClick={handleExportOrders}>Exportar CSV</button>
      {/* ... resto do componente */}
    </div>
  );
};
```

## 📍 Acessando o Painel de Auditoria

### URL
```
/super_admin/auditoria
```

### Acesso
- **Exclusivo para Super Admin**
- Outros usuários são redirecionados automaticamente

### Funcionalidades

1. **Filtros Avançados**
   - Por usuário específico
   - Por tipo de ação (view, create, update, delete, export)
   - Por termo de busca (email, tipo de entidade)
   - Filtro exclusivo para Admins Financeiros

2. **Estatísticas em Tempo Real**
   - Total de registros
   - Contagem por tipo de ação
   - Visualização rápida de atividades críticas

3. **Visualização Detalhada**
   - Data e hora precisa de cada ação
   - Email do usuário
   - Role do usuário
   - Tipo de entidade afetada
   - Detalhes da ação (JSON)

## 🔍 Consultas Úteis

### Buscar todas as ações de um Admin Financeiro específico

```typescript
const { data } = await supabase
  .from('user_activity_logs')
  .select(`
    *,
    users!inner (
      email,
      role
    )
  `)
  .eq('users.role', 'admin_financeiro')
  .eq('users.email', 'financeiro@example.com')
  .order('created_at', { ascending: false })
  .limit(100);
```

### Buscar todas as exportações de dados

```typescript
const { data } = await supabase
  .from('user_activity_logs')
  .select(`
    *,
    users (email, role)
  `)
  .eq('action_type', 'export')
  .gte('created_at', '2025-01-01')
  .order('created_at', { ascending: false });
```

### Buscar ações em um pedido específico

```typescript
const { data } = await supabase
  .from('user_activity_logs')
  .select(`
    *,
    users (email, role)
  `)
  .eq('entity_type', 'order')
  .eq('entity_id', 'order-uuid-123')
  .order('created_at', { ascending: false });
```

## 🎯 Boas Práticas

### 1. Registrar Ações Críticas
Sempre registre:
- Visualizações de dados financeiros sensíveis
- Criação/edição/exclusão de registros importantes
- Exportações de dados
- Mudanças de status de pedidos

### 2. Incluir Contexto Suficiente
```typescript
// ❌ Ruim - pouco contexto
logUpdate('order', orderId);

// ✅ Bom - contexto completo
logUpdate('order', orderId, {
  previous_status: 'pending',
  new_status: 'approved',
  amount: 1500.00,
  customer_email: 'cliente@example.com'
});
```

### 3. Usar Tipos Consistentes
Mantenha consistência nos `entity_type`:
- `order` (não `pedido`, `Order`, etc.)
- `benefit` (não `beneficio`, `provider_benefit`)
- `financial_report` (não `report`, `relatorio`)

### 4. Não Registrar Dados Sensíveis
Nunca inclua em logs:
- Senhas
- Tokens de autenticação
- Dados de cartão de crédito
- CPFs completos (use mascarados)

## 🚀 Criando um Novo Usuário Financeiro

1. Acesse o painel `/super_admin/usuarios`
2. Clique em "+ Novo Admin"
3. Preencha o email
4. Selecione "Administrador Financeiro" no dropdown
5. Senha padrão: `indexa2025`
6. Credenciais são automaticamente copiadas

## 📱 Componentes Criados

### Arquivos do Sistema de Auditoria

```
src/
├── hooks/
│   └── useActivityLogger.tsx         # Hook para registrar atividades
├── components/
│   └── admin/
│       └── audit/
│           └── AuditLogTable.tsx     # Tabela de visualização de logs
├── pages/
│   └── super_admin/
│       └── AuditPage.tsx             # Página principal de auditoria
└── docs/
    └── AUDITORIA_SISTEMA.md          # Esta documentação
```

## 🔄 Próximos Passos Recomendados

1. **Segurança**: Migrar para tabela `user_roles` separada
2. **Notificações**: Alertas automáticos para ações críticas
3. **Retenção**: Política de limpeza de logs antigos
4. **Performance**: Índices adicionais para queries comuns
5. **Compliance**: Exportação de logs para auditoria externa

## 📞 Suporte

Para questões sobre auditoria ou segurança, consulte o Super Admin do sistema.
