import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { ProviderBenefit, CreateBenefitRequest, TokenValidationResponse, BenefitChoiceResponse } from '@/types/providerBenefits';

export const useBenefitManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [benefits, setBenefits] = useState<ProviderBenefit[]>([]);

  const generateAccessToken = () => {
    return `EXAGIFT-${uuidv4().substring(0, 8).toUpperCase()}`;
  };

  const createBenefit = async (data: CreateBenefitRequest) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const accessToken = generateAccessToken();

      const { data: benefit, error } = await supabase
        .from('provider_benefits')
        .insert({
          provider_name: data.provider_name,
          provider_email: data.provider_email,
          activation_point: data.activation_point,
          observation: data.observation,
          access_token: accessToken,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar email de convite
      await sendInvitationEmail(benefit as ProviderBenefit);

      // Atualizar com data de envio
      await supabase
        .from('provider_benefits')
        .update({ invitation_sent_at: new Date().toISOString() })
        .eq('id', benefit.id);

      toast.success('Benefício criado e email enviado!');
      await listBenefits();
      return benefit;
    } catch (error: any) {
      console.error('Erro ao criar benefício:', error);
      toast.error(error.message || 'Erro ao criar benefício');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitationEmail = async (benefit: ProviderBenefit) => {
    try {
      const { error } = await supabase.functions.invoke('send-benefit-emails', {
        body: {
          type: 'invitation',
          data: {
            provider_name: benefit.provider_name,
            provider_email: benefit.provider_email,
            access_token: benefit.access_token,
            activation_point: benefit.activation_point,
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email de convite');
    }
  };

  const listBenefits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_benefits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBenefits((data || []) as ProviderBenefit[]);
      return data;
    } catch (error: any) {
      console.error('Erro ao listar benefícios:', error);
      toast.error('Erro ao carregar benefícios');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const insertGiftCode = async (benefitId: string, giftCode: string) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar benefício
      const { data: benefit, error: fetchError } = await supabase
        .from('provider_benefits')
        .select('*')
        .eq('id', benefitId)
        .single();

      if (fetchError) throw fetchError;

      if (!benefit.benefit_choice) {
        throw new Error('Prestador ainda não escolheu o presente');
      }

      // Atualizar com código
      const { error: updateError } = await supabase
        .from('provider_benefits')
        .update({
          gift_code: giftCode,
          gift_code_inserted_at: new Date().toISOString(),
          gift_code_inserted_by: user.id,
          status: 'code_sent',
        })
        .eq('id', benefitId);

      if (updateError) throw updateError;

      // Enviar email com código
      const { error: emailError } = await supabase.functions.invoke('send-benefit-emails', {
        body: {
          type: 'gift_code',
          data: {
            provider_name: benefit.provider_name,
            provider_email: benefit.provider_email,
            benefit_choice: benefit.benefit_choice,
            gift_code: giftCode,
          },
        },
      });

      if (emailError) throw emailError;

      // Atualizar data de envio final
      await supabase
        .from('provider_benefits')
        .update({ final_email_sent_at: new Date().toISOString() })
        .eq('id', benefitId);

      toast.success('Código enviado com sucesso!');
      await listBenefits();
    } catch (error: any) {
      console.error('Erro ao inserir código:', error);
      toast.error(error.message || 'Erro ao inserir código');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendInvitation = async (benefitId: string) => {
    setIsLoading(true);
    try {
      const { data: benefit, error } = await supabase
        .from('provider_benefits')
        .select('*')
        .eq('id', benefitId)
        .single();

      if (error) throw error;

      await sendInvitationEmail(benefit as ProviderBenefit);

      await supabase
        .from('provider_benefits')
        .update({ invitation_sent_at: new Date().toISOString() })
        .eq('id', benefitId);

      toast.success('Email reenviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast.error(error.message || 'Erro ao reenviar email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (token: string): Promise<TokenValidationResponse> => {
    try {
      const { data, error } = await supabase.rpc('validate_benefit_token', {
        p_token: token,
      });

      if (error) throw error;

      return data as unknown as TokenValidationResponse;
    } catch (error: any) {
      console.error('Erro ao validar token:', error);
      throw error;
    }
  };

  const registerChoice = async (token: string, choice: string): Promise<BenefitChoiceResponse> => {
    try {
      const { data, error } = await supabase.rpc('register_benefit_choice', {
        p_token: token,
        p_choice: choice,
      });

      if (error) throw error;

      return data as unknown as BenefitChoiceResponse;
    } catch (error: any) {
      console.error('Erro ao registrar escolha:', error);
      throw error;
    }
  };

  const copyBenefitLink = (token: string) => {
    const link = `https://exapainel.app/presente?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  return {
    isLoading,
    benefits,
    createBenefit,
    listBenefits,
    insertGiftCode,
    resendInvitation,
    validateToken,
    registerChoice,
    copyBenefitLink,
  };
};
