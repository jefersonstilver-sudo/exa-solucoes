INSERT INTO public.sindicos_interessados (
  sindico_nome, nome_predio, endereco_logradouro, endereco_numero,
  endereco_bairro, endereco_cidade, endereco_uf, cep,
  quantidade_andares, quantidade_unidades_total, quantidade_elevadores_sociais,
  quantidade_blocos, internet_operadoras, empresa_elevador,
  sindico_cpf, sindico_whatsapp, sindico_email, sindico_mandato_ate,
  aceite_timestamp, aceite_ip, aceite_user_agent
) VALUES (
  'João Teste Trigger', 'Edifício Teste Trigger', 'Rua Exemplo', '123',
  'Centro', 'Foz do Iguaçu', 'PR', '85851-000',
  12, 48, 2, 1,
  ARRAY['Vivo','Ligga']::text[], 'Atlas',
  '00000000000', '+5545999999999', 'teste-trigger@teste.com', '2027-12-31',
  NOW(), '127.0.0.1', 'Mozilla Test'
);