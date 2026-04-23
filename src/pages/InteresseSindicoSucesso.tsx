import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ExternalLink, Mail } from 'lucide-react';
import { useSindicoFormStore } from '@/components/interesse-sindico-form/formStore';
import '@/components/interesse-sindico-form/styles.css';

const EXA_LOGO_URL =
  'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

const InteresseSindicoSucesso: React.FC = () => {
  const [params] = useSearchParams();
  const protocolo = params.get('protocolo') || '—';

  // Limpa a store SOMENTE depois que esta tela montou — assim o formulário
  // anterior nunca aparece zerado durante a transição.
  useEffect(() => {
    useSindicoFormStore.getState().reset();
  }, []);

  return (
    <div className="exa-theme font-inter sif-shell min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex justify-center mb-6">
          <img src={EXA_LOGO_URL} alt="EXA" className="h-10 sm:h-12 w-auto" />
        </div>

        <div className="sif-card p-6 sm:p-8 text-center">
          <div className="sif-success-check">
            <CheckCircle2 size={48} strokeWidth={2.2} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-5">
            Interesse registrado com sucesso!
          </h1>

          <div className="mt-5 inline-flex flex-col items-center gap-1 px-5 py-3 rounded-xl border border-[var(--exa-red,#c7141a)]/40 bg-[var(--exa-red,#c7141a)]/10">
            <span className="text-xs uppercase tracking-widest text-white/55">
              Seu protocolo
            </span>
            <span className="text-lg font-bold text-white font-mono">{protocolo}</span>
          </div>

          <p className="text-sm sm:text-base text-white/75 mt-6 leading-relaxed">
            Recebemos os dados do seu prédio. Em até <strong>48 horas úteis</strong>, a equipe EXA
            entrará em contato pelo WhatsApp informado.
          </p>

          <div className="sif-warning-box mt-6 text-left">
            <AlertTriangle size={20} className="shrink-0" />
            <div>
              <p className="font-semibold text-white">Sujeito à aprovação da EXA</p>
              <p className="text-sm text-white/75 mt-1">
                Este registro é uma manifestação de interesse. A EXA analisa cada prédio
                individualmente e pode aprovar ou recusar a continuidade.
              </p>
            </div>
          </div>

          <a
            href="https://examidia.com.br"
            className="sif-btn-primary mt-7 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Voltar para examidia.com.br
            <ExternalLink size={16} />
          </a>

          <p className="text-xs text-white/45 mt-5 flex items-center justify-center gap-1">
            <Mail size={12} />O PDF oficial foi gerado e será enviado por e-mail em breve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteresseSindicoSucesso;
