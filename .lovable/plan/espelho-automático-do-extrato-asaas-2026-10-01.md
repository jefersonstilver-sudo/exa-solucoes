# Espelho automático do extrato Asaas

## Resultado esperado
Na área financeira, apresentar uma página de extrato bancário com todos os movimentos efetivos da conta Asaas, saldo por movimento, filtros e situação da conferência. A atualização e a conciliação dos movimentos devem ocorrer automaticamente a partir do Asaas; a planilha enviada serve **somente como balizador de validação**, nunca como fonte importada ou lançada manualmente.

## Evidência já conferida
- O arquivo enviado cobre **09/01/2026 a 01/10/2026**, com **492 transações identificadas**, IDs sem repetição, soma líquida e saldo final de **R$ 1.063,24**. Há recebimentos, transferências Pix, contas pagas, tarifas, descontos, estornos e cartão; por isso consultar só cobranças e saídas não reproduz o extrato.
- A consulta ao saldo ao vivo retornou **R$ 1.063,24** às 03:23:28 UTC de 01/10/2026. O valor coincide com o saldo final do arquivo naquele momento; essa coincidência não comprova correspondência linha a linha.
- A tabela `extrato_bancario` tem **0 linhas**. Os espelhos existentes têm **61** cobranças/entradas em `transacoes_asaas` (última sincronização observada em 03/09) e **368** saídas em `asaas_saidas` (sincronizadas em 01/10). A tela de Lançamentos lê uma visão desses dados e permite sincronização manual; ela não é ainda um espelho integral do extrato bancário.
- A API oficial Asaas oferece o extrato em `/v3/financialTransactions`, paginado por `limit`/`offset`, com identidade da transação e saldo após o movimento.

## Etapas
1. **Ingestão fiel:** criar espelho separado do extrato oficial, com ID único da transação, data, tipo original, descrição, valor com sinal, saldo após lançamento, referências oficiais quando disponíveis, dados de origem e horário da última sincronização. Paginá-lo completamente, preservar IDs e tipos sem inferir pagamentos por descrição ou valor, e repetir a leitura sem duplicar linhas.
2. **Automação segura:** estabelecer atualização periódica autenticada e retentativas monitoradas, além de atualização em resposta aos eventos Asaas já recebidos quando aplicável. Verificar o mecanismo de agendamento disponível antes de ativá-lo; **não reativar** os agendamentos financeiros antigos nem usar endpoint público sem autenticação. Mostrar quando a leitura falhar ou estiver atrasada, em vez de declarar o extrato atualizado.
3. **Conferência automática:** relacionar linhas do extrato a cobranças, transferências e pagamentos de contas **apenas pelas referências oficiais inequívocas do Asaas**. Mostrar "correspondente", "sem correspondência" ou "ambíguo" quando faltarem referências; não dar baixa, quitar dívida ou mudar pedidos/status financeiros com base em nome, valor ou proximidade temporal.
4. **Página do extrato:** incluir saldo disponível consultado ao vivo, saldo final do extrato, movimentos paginados, pesquisa, filtros por data/tipo e indicadores de sincronização/conciliação na área de Lançamentos, preservando os demais fluxos existentes.
5. **Validação real:** comparar a leitura completa da API com o arquivo apenas como referência: período, 492 IDs, tipos, valores assinados, ordem/saldos e fechamento de R$ 1.063,24 para aquela fotografia. Investigar e listar qualquer divergência antes de afirmar que o espelho está completo. Repetir uma execução e confirmar idempotência e ausência de efeitos em cobranças, pedidos ou dívidas.

## Detalhes técnicos e proteção
- Criar tabela específica para movimentos do extrato e políticas de leitura administrativa; escrita exclusivamente pelo serviço autenticado. Registrar progresso, erros e período em `sync_runs`.
- Não reutilizar `extrato_bancario` sem antes validar seu propósito e acesso: a política atual denominada "Service role full access extrato" se aplica a `public`, o que exige cuidado antes de expor dados bancários nessa tabela.
- O arquivo não será enviado ao banco ou usado para gerar registros. Credenciais Asaas permanecem somente no serviço seguro.
- Qualquer correspondência que dependa de confirmação humana permanece **não conciliada** até existir referência oficial suficiente; nenhuma automação financeira suspensa será reativada por este trabalho.
