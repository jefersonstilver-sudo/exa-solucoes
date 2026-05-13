# Correção dos filtros da página /super_admin/predios

## Diagnóstico (causa raiz)

Auditando a base e o código:

- DB tem hoje: `ativo` (18), `interno` (3), `instalacao` (2). Não existe `manutenção` nem `inativo`.
- Em `BuildingsFilters3.tsx` os valores comparados estão com acento/cedilha: `'manutenção'` e `'instalação'`. Por isso a pílula **Instalação aparece 0** mesmo com 2 prédios.
- Não existe pílula para **Internos**, então os 3 prédios internos não têm filtro próprio (apesar de virem na lista).
- A linha do dropdown **Airbnb / Padrão / Painéis / Device** existe no componente, mas fica "escondida" como terceira linha; o usuário relata não vê-la. Precisa ficar visível e usável no fluxo.
- `tem_airbnb` está corretamente lido (2 prédios marcados), só falta dar destaque ao filtro.

## O que vai mudar (somente UI/filtros)

Arquivos: `src/components/admin/buildings/v3/BuildingsFilters3.tsx` e `src/pages/admin/BuildingsManagement3.tsx`. Nada em RLS, edge functions, cards, modais ou fluxo comercial.

### 1. Corrigir os status para os valores reais do DB
- `'manutenção'` → `'manutencao'`
- `'instalação'` → `'instalacao'`
- Adicionar pílula **Internos** com `status === 'interno'` (ícone Lock/EyeOff, cor roxa, alinhado ao memory de visibilidade — Interno é admin-only).
- Contagens das pílulas passam a refletir o que existe (Ativos 18, Internos 3, Instalação 2, Inativos 0, Manutenção 0).

### 2. Tornar o filtro Airbnb explícito e visível
- Promover Airbnb a uma **pílula toggle dedicada** ao lado das pílulas de status (3 estados em 1 clique: Todos → Com Airbnb → Sem Airbnb), com ícone Home e contagem (`com Airbnb: N`).
- Manter também na linha de filtros refinados o restante (Padrão de público, Painéis, Device) como Selects, mas com rótulos mais claros (`Padrão: Alto/Médio/Normal`, `Painéis: Com ativos/Sem`, `Device: Online/Offline/Sem`).

### 3. Manter ordenação atual
- Default `Atualizado recentemente` (`local_updated_at desc`) — já implementado, garante que prédio editado sobe para o topo via trigger + realtime.
- Demais opções permanecem: Mais recentes, Nome A→Z, Maior público, Mais painéis ativos.

### 4. Botão "Limpar filtros" reaparece sempre que qualquer filtro (incluindo status, airbnb, padrão, painéis, device) sair do default.

## Layout final da barra

```text
[ 🔍 Buscar nome/endereço/bairro ]                       [ ↕ Atualizado recentemente ▾ ]

[Todos 23] [Ativos 18] [Internos 3] [Instalação 2] [Manutenção 0] [Inativos 0]   |   [🏠 Airbnb: Todos ▸]

[Padrão ▾] [Painéis ▾] [Device ▾]                                            [✕ Limpar filtros]
```

## Validação após deploy

- Pílula **Instalação** mostra 2 e filtra corretamente.
- Pílula **Internos** aparece e mostra 3.
- Pílula **Airbnb** alterna entre Todos/Com/Sem e a contagem bate com o DB (2 com Airbnb).
- Editar um prédio (qualquer campo) faz ele subir para o topo mantendo filtros aplicados.
- Nenhum card, modal, upload ou fluxo de contrato sofre alteração.
