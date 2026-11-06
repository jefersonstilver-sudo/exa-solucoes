-- EXA (06/11/2026): as telas não desligam mais — operação de 24 h por dia (Jeferson).
-- Muda os números oficiais (regra do player v22, prédio lotado): horizontal ≈ 314/dia, vertical premium ≈ 524/dia.
update public.configuracoes_exibicao set horas_operacao_dia = 24 where horas_operacao_dia is distinct from 24;
