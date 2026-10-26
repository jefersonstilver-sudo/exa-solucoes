-- EXA 2.0: novo layout da tela (desde 23/10/2026). A área do anúncio horizontal é 1080×890 (≈6:5, quase quadrada).
update public.produtos_exa
   set resolucao = '1080x890', proporcao = '6:5', ultima_alteracao_em = now(), updated_at = now()
 where codigo = 'horizontal';
