-- Atualizar especificações oficiais 2026 dos produtos EXA
UPDATE public.produtos_exa
SET duracao_video_segundos = 10,
    max_clientes_por_painel = 15
WHERE codigo = 'horizontal';

UPDATE public.produtos_exa
SET duracao_video_segundos = 15,
    max_clientes_por_painel = 3
WHERE codigo = 'vertical_premium';

-- Atualizar configurações globais para 23h de operação
UPDATE public.configuracoes_exibicao
SET horas_operacao_dia = 23;