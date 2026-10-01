# Conferência somente leitura: saldo e extrato Asaas

## Objetivo
Conferir o saldo atual da conta Asaas e o que é possível verificar do extrato, separando dados ao vivo de registros históricos locais. Não alterar pagamentos, cobranças, pedidos ou lançamentos.

## Situação verificada
- A consulta ao saldo ao vivo respondeu HTTP 200 às 03:23:28 UTC de 01/10/2026, com saldo disponível de **R$ 1.063,24**.
- A mesma resposta informou R$ 0,00 a liberar e R$ 0,00 bloqueado, mas esses campos são derivados pelo sistema: “a liberar” soma pagamentos pendentes da primeira página e “bloqueado” é fixado em zero. Não são saldos separados confirmados pelo Asaas.
- A tabela local `extrato_bancario` está vazia. Há 61 registros de entradas/cobranças em `transacoes_asaas`, com última sincronização observada em 03/09/2026, e 368 saídas em `asaas_saidas`, com sincronização observada em 01/10/2026. Esses registros não constituem, por si só, um extrato bancário completo e atualizado.
- O webhook Asaas registra eventos recebidos, mas não atualiza automaticamente os lançamentos financeiros.

## Conferência proposta
1. Consultar novamente o saldo ao vivo em modo somente leitura e anotar o horário da resposta.
2. Identificar se já existe no projeto um caminho seguro de leitura do extrato oficial do Asaas. Se houver, consultar movimentos recentes com paginação, sem sincronizar nem gravar dados; se não houver, informar explicitamente que o extrato oficial não pode ser confirmado por essa via.
3. Comparar apenas os totais e períodos efetivamente cobertos pelos dados consultados com os registros locais, sem presumir conciliação por nome ou valor e sem acionar sincronizações.
4. Entregar um resumo com saldo confirmado, período do extrato disponível, diferenças ou lacunas e limites da verificação.

## Limites técnicos
Nenhum evento artificial, alteração no banco, nova cobrança ou operação de escrita. Valores de cobrança pendente não serão apresentados como saldo financeiro disponível nem como extrato completo.
