import { supabase } from '@/integrations/supabase/client';
import { captureEvidencias } from './captureEvidencias';
import { normalizeBRPhoneToE164 } from './phoneE164';
import type { PredioState, SindicoState } from '@/components/interesse-sindico-form/formStore';

export interface SubmitResult {
  success: boolean;
  protocolo?: string;
  pdf_path?: string;
  error?: string;
}

export async function submitFormulario(
  predio: PredioState,
  sindico: SindicoState,
): Promise<SubmitResult> {
  try {
    // 1. Evidências
    const evid = await captureEvidencias();

    // 2. Normalização do WhatsApp para E.164
    const whatsappE164 = normalizeBRPhoneToE164(sindico.whatsappRaw || '') || sindico.whatsappRaw || '';
    const celularDigits = (sindico.whatsappRaw || '').replace(/\D/g, '');

    // 3. Endereço completo (legado)
    const enderecoCompleto = [
      predio.logradouro,
      predio.numero,
      predio.complemento ? `(${predio.complemento})` : '',
      predio.bairro,
      `${predio.cidade}/${predio.uf}`,
      predio.cep,
    ]
      .filter(Boolean)
      .join(', ');

    // 4. INSERT — todos os campos do formulário
    const insertPayload: any = {
      // Prédio
      nome_predio: predio.nomePredio,
      endereco_logradouro: predio.logradouro,
      endereco_numero: predio.numero,
      endereco_complemento: predio.complemento || null,
      endereco_bairro: predio.bairro,
      endereco_cidade: predio.cidade,
      endereco_uf: predio.uf,
      endereco_cep: predio.cep,
      endereco_latitude: predio.latitude ?? null,
      endereco_longitude: predio.longitude ?? null,
      google_place_id: predio.googlePlaceId ?? null,
      quantidade_andares: predio.andares,
      quantidade_blocos: predio.blocos ?? 1,
      quantidade_unidades: predio.unidades,
      quantidade_elevadores_sociais: predio.elevadoresSociais,
      internet_operadoras: predio.internetOps ?? [],
      empresa_elevador: predio.elevadorEmpresa,
      elevador_casa_maquinas: predio.casaMaquinas,
      // Síndico
      sindico_nome: sindico.nomeCompleto,
      sindico_cpf: (sindico.cpf || '').replace(/\D/g, ''),
      sindico_whatsapp: whatsappE164,
      sindico_email: (sindico.email || '').toLowerCase().trim(),
      sindico_mandato_ate: sindico.mandatoAte || null,
      // Aceite — evidências
      aceite_timestamp: evid.timestamp,
      aceite_ip: evid.ip,
      aceite_user_agent: evid.user_agent,
      // Legados (defesa em profundidade — triggers também sincronizam)
      nome_completo: sindico.nomeCompleto,
      endereco: enderecoCompleto,
      numero_andares: predio.andares,
      numero_unidades: predio.unidades,
      email: (sindico.email || '').toLowerCase().trim(),
      celular: celularDigits,
      status: 'novo',
    };

    const { data: inserted, error: insertErr } = await (supabase as any)
      .from('sindicos_interessados')
      .insert(insertPayload)
      .select('id, protocolo')
      .single();

    if (insertErr || !inserted) {
      console.error('[submitFormulario] insert failed:', insertErr);
      return { success: false, error: insertErr?.message || 'Falha ao registrar' };
    }

    const recordId: string = inserted.id;
    const protocolo: string = inserted.protocolo;

    // 5. Upload de fotos (se houver)
    if (sindico.fotos && sindico.fotos.length > 0) {
      const uploadedPaths: string[] = [];
      for (let i = 0; i < sindico.fotos.length; i++) {
        const file = sindico.fotos[i];
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${recordId}/foto-${i + 1}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('fotos-sindicos')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (!upErr) uploadedPaths.push(path);
        else console.warn('[submitFormulario] foto upload falhou:', upErr);
      }
      if (uploadedPaths.length > 0) {
        await (supabase as any)
          .from('sindicos_interessados')
          .update({ fotos_elevador_urls: uploadedPaths })
          .eq('id', recordId);
      }
    }

    // 6. Invocar edge function para gerar PDF oficial
    const { data: pdfResp, error: pdfErr } = await supabase.functions.invoke(
      'gerar-pdf-aceite-sindico',
      { body: { sindico_interessado_id: recordId } },
    );

    if (pdfErr) {
      console.warn('[submitFormulario] PDF generation failed (não bloqueia):', pdfErr);
    }

    return {
      success: true,
      protocolo,
      pdf_path: (pdfResp as any)?.pdf_path,
    };
  } catch (err: any) {
    console.error('[submitFormulario] erro inesperado:', err);
    return { success: false, error: err?.message || 'Erro inesperado' };
  }
}
