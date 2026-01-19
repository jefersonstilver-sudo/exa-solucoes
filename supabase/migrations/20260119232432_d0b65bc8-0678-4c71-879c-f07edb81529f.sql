-- =============================================
-- FASE 3.2 — SEEDS DO SISTEMA DE TAREFAS (COMPLETO)
-- =============================================
-- Schemas validados e corrigidos
-- =============================================

-- =============================================
-- ETAPA 1: TASK TYPES CANÔNICOS (9 registros)
-- =============================================

INSERT INTO task_types (id, codigo, nome, descricao, departamento, prioridade_padrao, requer_checklist, ativo) VALUES
('a1000000-0000-0000-0000-000000000001', 'ADM-001', 'Gestão Administrativa', 'Atividades administrativas gerais, documentação e processos internos', 'Administrativo', 'media', false, true),
('a1000000-0000-0000-0000-000000000002', 'ATE-001', 'Suporte e Atendimento', 'Atendimento a clientes, suporte técnico e resolução de chamados', 'Atendimento', 'alta', false, true),
('a1000000-0000-0000-0000-000000000003', 'EXP-001', 'Prospecção e Expansão', 'Prospecção de novos pontos, negociação com síndicos e expansão de rede', 'Expansão', 'media', true, true),
('a1000000-0000-0000-0000-000000000004', 'FIN-001', 'Gestão Financeira', 'Conciliação, pagamentos, cobranças e controle financeiro', 'Financeiro', 'alta', true, true),
('a1000000-0000-0000-0000-000000000005', 'IAA-001', 'Automação e IA', 'Manutenção de fluxos automatizados, agentes de IA e integrações', 'IA & Automação', 'media', true, true),
('a1000000-0000-0000-0000-000000000006', 'MKT-001', 'Comunicação e Marketing', 'Planejamento de conteúdo, campanhas, métricas e comunicação', 'Marketing', 'media', true, true),
('a1000000-0000-0000-0000-000000000007', 'OPE-001', 'Operação de Campo', 'Verificação de painéis, manutenção, instalação e operação técnica', 'Operação', 'alta', true, true),
('a1000000-0000-0000-0000-000000000008', 'TEC-001', 'Infraestrutura Tecnológica', 'Monitoramento de sistemas, deploys, infraestrutura e suporte técnico', 'Tecnologia', 'alta', true, true),
('a1000000-0000-0000-0000-000000000009', 'VEN-001', 'Gestão Comercial', 'Pipeline de vendas, propostas, negociações e fechamentos', 'Vendas', 'alta', false, true);

-- =============================================
-- ETAPA 2: RESPONSÁVEIS PADRÃO POR TIPO (9 registros)
-- =============================================

INSERT INTO task_type_responsaveis_padrao (task_type_id, user_id) VALUES
('a1000000-0000-0000-0000-000000000001', '7cca6d1b-ca4f-4190-a7fe-5148e7dc2308'), -- ADM → Jefferson
('a1000000-0000-0000-0000-000000000002', 'c9ff75c5-a051-4b6d-a278-cdd5a2306820'), -- ATE → Eduardo
('a1000000-0000-0000-0000-000000000003', 'c9ff75c5-a051-4b6d-a278-cdd5a2306820'), -- EXP → Eduardo
('a1000000-0000-0000-0000-000000000004', '21333746-3d73-48f2-8af8-61fb3f86bcf8'), -- FIN → Financeiro
('a1000000-0000-0000-0000-000000000005', '7cca6d1b-ca4f-4190-a7fe-5148e7dc2308'), -- IAA → Jefferson
('a1000000-0000-0000-0000-000000000006', '7cca6d1b-ca4f-4190-a7fe-5148e7dc2308'), -- MKT → Jefferson
('a1000000-0000-0000-0000-000000000007', 'ed2fbe51-c938-4bdd-9c14-a58d02e3faa9'), -- OPE → João
('a1000000-0000-0000-0000-000000000008', 'ed2fbe51-c938-4bdd-9c14-a58d02e3faa9'), -- TEC → João
('a1000000-0000-0000-0000-000000000009', 'c9ff75c5-a051-4b6d-a278-cdd5a2306820'); -- VEN → Eduardo

-- =============================================
-- ETAPA 3: ROTINAS RECORRENTES (9 registros)
-- Usando colunas corretas: horario_inicio, horario_limite
-- =============================================

INSERT INTO task_rotinas (id, task_type_id, nome, descricao, frequencia, dias_semana, horario_inicio, horario_limite, todos_responsaveis, ativo) VALUES
-- Administrativo (Semanal - Segunda)
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 
 'Revisão Semanal Administrativa', 
 'Revisão de documentos pendentes, processos internos e organização administrativa',
 'semanal', ARRAY['segunda']::dia_semana[], '09:00:00', '12:00:00', true, true),

-- Atendimento (Diária)
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 
 'Verificação Diária de Chamados', 
 'Revisão de todos os chamados abertos, pendentes e em andamento',
 'diaria', NULL, '08:00:00', '10:00:00', false, true),

-- Expansão (Semanal - Terça)
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 
 'Prospecção Semanal', 
 'Follow-up com síndicos, prospecção de novos prédios e atualização de pipeline',
 'semanal', ARRAY['terca']::dia_semana[], '10:00:00', '12:00:00', false, true),

-- Financeiro (Diária)
('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 
 'Conciliação Diária ASAAS', 
 'Sincronização e verificação de transações financeiras no ASAAS',
 'diaria', NULL, '09:00:00', '11:00:00', false, true),

-- IA & Automação (Semanal - Quarta)
('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 
 'Auditoria Semanal de Fluxos', 
 'Revisão de automações ativas, taxas de sucesso e identificação de melhorias',
 'semanal', ARRAY['quarta']::dia_semana[], '14:00:00', '17:00:00', true, true),

-- Marketing (Semanal - Segunda)
('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 
 'Planejamento Semanal de Marketing', 
 'Definição de conteúdos, revisão de métricas e planejamento de campanhas',
 'semanal', ARRAY['segunda']::dia_semana[], '10:00:00', '12:00:00', true, true),

-- Operação (Diária)
('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 
 'Verificação Diária de Painéis', 
 'Monitoramento de status online, sincronização e identificação de falhas',
 'diaria', NULL, '08:00:00', '09:00:00', false, true),

-- Tecnologia (Diária)
('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 
 'Monitoramento Diário de Sistemas', 
 'Verificação de uptime, logs de erro e status de integrações',
 'diaria', NULL, '07:00:00', '08:00:00', true, true),

-- Vendas (Semanal - Segunda)
('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 
 'Revisão Semanal de Pipeline', 
 'Análise de propostas pendentes, follow-ups necessários e previsão de fechamentos',
 'semanal', ARRAY['segunda']::dia_semana[], '09:00:00', '11:00:00', false, true);

-- =============================================
-- ETAPA 4: RESPONSÁVEIS POR ROTINA (5 registros)
-- Apenas para rotinas com todos_responsaveis = false
-- =============================================

INSERT INTO task_rotina_responsaveis (rotina_id, user_id) VALUES
('b1000000-0000-0000-0000-000000000002', 'c9ff75c5-a051-4b6d-a278-cdd5a2306820'), -- Atendimento → Eduardo
('b1000000-0000-0000-0000-000000000003', 'c9ff75c5-a051-4b6d-a278-cdd5a2306820'), -- Expansão → Eduardo
('b1000000-0000-0000-0000-000000000004', '21333746-3d73-48f2-8af8-61fb3f86bcf8'), -- Financeiro → Financeiro Exa
('b1000000-0000-0000-0000-000000000007', 'ed2fbe51-c938-4bdd-9c14-a58d02e3faa9'), -- Operação → João
('b1000000-0000-0000-0000-000000000009', 'c9ff75c5-a051-4b6d-a278-cdd5a2306820'); -- Vendas → Eduardo

-- =============================================
-- ETAPA 5: CHECKLISTS DE ROTINA (27 itens)
-- Usando coluna correta: descricao (não item)
-- =============================================

-- Administrativo (3 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000001', 'Revisar documentos pendentes de assinatura', 1, true),
('b1000000-0000-0000-0000-000000000001', 'Atualizar status de processos internos', 2, true),
('b1000000-0000-0000-0000-000000000001', 'Organizar agenda administrativa da semana', 3, false);

-- Atendimento (3 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000002', 'Verificar chamados abertos não respondidos', 1, true),
('b1000000-0000-0000-0000-000000000002', 'Priorizar chamados por urgência', 2, true),
('b1000000-0000-0000-0000-000000000002', 'Atualizar status de chamados em andamento', 3, true);

-- Expansão (3 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000003', 'Revisar leads de síndicos pendentes', 1, true),
('b1000000-0000-0000-0000-000000000003', 'Agendar visitas de prospecção', 2, false),
('b1000000-0000-0000-0000-000000000003', 'Atualizar pipeline de expansão', 3, true);

-- Financeiro (4 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000004', 'Sincronizar transações de entrada ASAAS', 1, true),
('b1000000-0000-0000-0000-000000000004', 'Sincronizar saídas ASAAS', 2, true),
('b1000000-0000-0000-0000-000000000004', 'Verificar divergências pendentes', 3, true),
('b1000000-0000-0000-0000-000000000004', 'Categorizar lançamentos não vinculados', 4, false);

-- IA & Automação (3 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000005', 'Revisar automações ativas e taxas de sucesso', 1, true),
('b1000000-0000-0000-0000-000000000005', 'Identificar fluxos com falhas recorrentes', 2, true),
('b1000000-0000-0000-0000-000000000005', 'Documentar melhorias necessárias', 3, false);

-- Marketing (3 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000006', 'Revisar performance de campanhas anteriores', 1, true),
('b1000000-0000-0000-0000-000000000006', 'Definir temas e conteúdos da semana', 2, true),
('b1000000-0000-0000-0000-000000000006', 'Agendar publicações no calendário', 3, true);

-- Operação (4 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000007', 'Verificar status online de todos os painéis', 1, true),
('b1000000-0000-0000-0000-000000000007', 'Conferir última sincronização de cada painel', 2, true),
('b1000000-0000-0000-0000-000000000007', 'Identificar painéis offline há mais de 24h', 3, true),
('b1000000-0000-0000-0000-000000000007', 'Registrar ocorrências no sistema', 4, false);

-- Tecnologia (3 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000008', 'Verificar uptime de serviços críticos', 1, true),
('b1000000-0000-0000-0000-000000000008', 'Checar logs de erro das últimas 24h', 2, true),
('b1000000-0000-0000-0000-000000000008', 'Validar status de integrações ativas', 3, true);

-- Vendas (3 itens)
INSERT INTO task_rotina_checklist (rotina_id, descricao, ordem, obrigatorio) VALUES
('b1000000-0000-0000-0000-000000000009', 'Revisar propostas pendentes de resposta', 1, true),
('b1000000-0000-0000-0000-000000000009', 'Priorizar follow-ups da semana', 2, true),
('b1000000-0000-0000-0000-000000000009', 'Atualizar previsão de fechamentos', 3, false);