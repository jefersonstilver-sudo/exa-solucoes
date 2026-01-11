-- Popular tabela de fornecedores com provedores de internet (incluindo CNPJ obrigatório)
INSERT INTO public.fornecedores (cnpj, razao_social, nome_fantasia, tipo, ativo)
VALUES 
  ('00000000000101', 'LIGGA TELECOMUNICACOES LTDA', 'LIGGA', 'servico', true),
  ('00000000000102', 'TELECOM FOZ TELECOMUNICACOES LTDA', 'TELECOM FOZ', 'servico', true),
  ('02558157000162', 'TELEFONICA BRASIL S.A.', 'VIVO', 'servico', true),
  ('40432544000147', 'CLARO S.A.', 'CLARO', 'servico', true),
  ('76535764000143', 'OI S.A.', 'OI', 'servico', true),
  ('02421421000111', 'TIM S.A.', 'TIM', 'servico', true)
ON CONFLICT (cnpj) DO NOTHING;