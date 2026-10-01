-- Pausa reversível de automações financeiras; nenhuma linha financeira é atualizada ou excluída.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'maintain-expense-installments-monthly' AND active) THEN
    PERFORM cron.alter_job(job_id := (SELECT jobid FROM cron.job WHERE jobname = 'maintain-expense-installments-monthly'), active := false);
  END IF;
END $$;
ALTER TABLE public.despesas_fixas DISABLE TRIGGER after_insert_despesa_fixa;
ALTER TABLE public.funcionarios DISABLE TRIGGER trg_funcionario_create_despesa;
ALTER TABLE public.funcionarios DISABLE TRIGGER trg_funcionario_update_despesa;
ALTER TABLE public.cobrancas DISABLE TRIGGER trg_atualizar_proxima_cobranca;
ALTER TABLE public.cobrancas DISABLE TRIGGER trg_fluxo_caixa_cobranca;
ALTER TABLE public.recebimentos DISABLE TRIGGER trg_fluxo_caixa_recebimento;
ALTER TABLE public.pedidos DISABLE TRIGGER trigger_notify_payment_confirmed;