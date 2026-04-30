import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { validateEmail, sanitizeEmail } from '@/utils/emailValidation';
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

      // 1. Validar email
      const sanitizedEmail = sanitizeEmail(data.provider_email);
      const validation = validateEmail(sanitizedEmail);
      
      if (!validation.valid) {
        toast.error(validation.error || 'Email inválido');
        throw new Error(validation.error || 'Email inválido');
      }

      // 2. Verificar duplicatas (mesmo email em status ativo)
      const { data: existingBenefits, error: checkError } = await supabase
        .from('provider_benefits')
        .select('id, provider_name, status')
        .eq('provider_email', sanitizedEmail)
        .neq('status', 'cancelled');

      if (checkError) throw checkError;

      if (existingBenefits && existingBenefits.length > 0) {
        toast.warning(`⚠️ Já existe um benefício ativo para ${sanitizedEmail}`, {
          description: 'Use o botão "Reenviar" para enviar o link novamente',
          duration: 5000,
        });
        throw new Error('Email já possui benefício ativo');
      }

      const accessToken = generateAccessToken();

      console.log('📧 Criando benefício para:', sanitizedEmail);

      const { data: benefit, error } = await supabase
        .from('provider_benefits')
        .insert({
          provider_name: data.provider_name,
          provider_email: sanitizedEmail,
          activation_point: data.activation_point,
          observation: data.observation,
          access_token: accessToken,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Benefício criado:', benefit.id);

      // Enviar email de convite
      try {
        await sendInvitationEmail(benefit as ProviderBenefit);
        
        // Atualizar com data de envio
        await supabase
          .from('provider_benefits')
          .update({ invitation_sent_at: new Date().toISOString() })
          .eq('id', benefit.id);

        console.log('📧 Email enviado com sucesso para:', sanitizedEmail);
        
        toast.success(`✅ Email enviado para ${sanitizedEmail}`, {
          description: '📮 Lembre o prestador de verificar a pasta de spam/lixeira',
          duration: 6000,
        });
      } catch (emailError: any) {
        console.error('❌ Erro ao enviar email:', emailError);
        toast.error(`Benefício criado mas email falhou para ${sanitizedEmail}`, {
          description: 'Use o botão "Reenviar" para tentar novamente',
          duration: 5000,
        });
      }

      await listBenefits();
      return benefit;
    } catch (error: any) {
      console.error('❌ Erro ao criar benefício:', error);
      
      if (!error.message?.includes('Email já possui benefício ativo')) {
        toast.error(error.message || 'Erro ao criar benefício');
      }
      
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
      console.log('📋 listBenefits: Fetching benefits...');
      const { data, error } = await supabase
        .from('provider_benefits')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📋 listBenefits result:', { data, error });

      if (error) throw error;

      // Ordenar: primeiro os que precisam de código (escolheram mas ainda não têm código)
      // Depois os demais por data de criação
      const sortedData = (data || []).sort((a, b) => {
        const aRequiresAction = a.benefit_choice && !a.gift_code && a.status !== 'cancelled';
        const bRequiresAction = b.benefit_choice && !b.gift_code && b.status !== 'cancelled';
        
        if (aRequiresAction && !bRequiresAction) return -1;
        if (!aRequiresAction && bRequiresAction) return 1;
        
        // Se ambos precisam de ação ou nenhum precisa, ordenar por data
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setBenefits(sortedData as ProviderBenefit[]);
      console.log('✅ Benefits loaded:', sortedData?.length || 0);
      return sortedData;
    } catch (error: any) {
      console.error('❌ Erro ao listar benefícios:', error);
      toast.error('Erro ao carregar benefícios');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const insertGiftCode = async (benefitId: string, giftCode: string, deliveryType: 'code' | 'link', instructions: string) => {
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

      console.log('🎁 Inserindo código para:', benefit.provider_email);

      // Atualizar com código
      const { error: updateError } = await supabase
        .from('provider_benefits')
        .update({
          gift_code: giftCode,
          gift_code_inserted_at: new Date().toISOString(),
          gift_code_inserted_by: user.id,
          delivery_type: deliveryType,
          redemption_instructions: instructions,
          status: 'code_sent',
        })
        .eq('id', benefitId);

      if (updateError) throw updateError;

      // Enviar email com código
      try {
        const { error: emailError } = await supabase.functions.invoke('send-benefit-emails', {
          body: {
            type: 'gift_code',
            data: {
              provider_name: benefit.provider_name,
              provider_email: benefit.provider_email,
              benefit_choice: benefit.benefit_choice,
              gift_code: giftCode,
              delivery_type: deliveryType,
              redemption_instructions: instructions,
            },
          },
        });

        if (emailError) throw emailError;

        // Atualizar data de envio final
        await supabase
          .from('provider_benefits')
          .update({ final_email_sent_at: new Date().toISOString() })
          .eq('id', benefitId);

        console.log('✅ Código enviado com sucesso');

        toast.success(`✅ Código enviado para ${benefit.provider_email}`, {
          description: '🎁 O prestador receberá o código/link por email',
          duration: 5000,
        });
      } catch (emailError: any) {
        console.error('❌ Erro ao enviar email com código:', emailError);
        toast.error(`Código salvo mas email falhou para ${benefit.provider_email}`, {
          description: 'Você pode tentar reenviar manualmente',
          duration: 5000,
        });
      }

      await listBenefits();
    } catch (error: any) {
      console.error('❌ Erro ao inserir código:', error);
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

      console.log('📧 Reenviando email para:', benefit.provider_email);

      await sendInvitationEmail(benefit as ProviderBenefit);

      await supabase
        .from('provider_benefits')
        .update({ invitation_sent_at: new Date().toISOString() })
        .eq('id', benefitId);

      console.log('✅ Email reenviado com sucesso');

      toast.success(`✅ Email reenviado para ${benefit.provider_email}`, {
        description: '📮 Lembre o prestador de verificar a pasta de spam/lixeira',
        duration: 6000,
      });
    } catch (error: any) {
      console.error('❌ Erro ao reenviar email:', error);
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
    const link = `https://www.examidia.com.br/presente?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const cancelBenefit = async (benefitId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('provider_benefits')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', benefitId);

      if (error) throw error;

      toast.success('Benefício cancelado! O link não é mais válido.');
      await listBenefits();
    } catch (error: any) {
      console.error('Erro ao cancelar benefício:', error);
      toast.error(error.message || 'Erro ao cancelar benefício');
      throw error;
    } finally {
      setIsLoading(false);
    }
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
    cancelBenefit,
  };
};
