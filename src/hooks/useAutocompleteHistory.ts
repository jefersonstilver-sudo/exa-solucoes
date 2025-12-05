import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AutocompleteEntry {
  id: string;
  field_type: string;
  field_value: string;
  display_label: string | null;
  metadata: Record<string, any>;
  frequency: number;
  last_used_at: string;
}

export const useAutocompleteHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getSuggestions = useCallback(async (
    fieldType: string, 
    searchTerm: string
  ): Promise<AutocompleteEntry[]> => {
    if (!user || !searchTerm || searchTerm.length < 2) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_autocomplete_history')
        .select('*')
        .eq('field_type', fieldType)
        .ilike('field_value', `${searchTerm}%`)
        .order('frequency', { ascending: false })
        .order('last_used_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Erro ao buscar sugestões:', error);
        return [];
      }
      
      return (data || []) as AutocompleteEntry[];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveToHistory = useCallback(async (
    fieldType: string, 
    value: string, 
    metadata?: Record<string, any>,
    displayLabel?: string
  ) => {
    if (!user || !value || value.trim().length < 2) return;
    
    try {
      const { error } = await supabase.rpc('upsert_autocomplete_history', {
        p_field_type: fieldType,
        p_field_value: value.trim(),
        p_metadata: metadata || null,
        p_display_label: displayLabel || null
      });
      
      if (error) {
        console.error('Erro ao salvar histórico:', error);
      }
    } catch (err) {
      console.error('Erro ao salvar autocomplete:', err);
    }
  }, [user]);

  const removeFromHistory = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_autocomplete_history')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao remover do histórico:', error);
      }
    } catch (err) {
      console.error('Erro ao remover autocomplete:', err);
    }
  }, [user]);

  const saveClientData = useCallback(async (clientData: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) => {
    if (!user) return;
    
    const fullName = [clientData.firstName, clientData.lastName].filter(Boolean).join(' ');
    const displayLabel = clientData.companyName 
      ? `${fullName} - ${clientData.companyName}`
      : fullName;
    
    const metadata = {
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      companyName: clientData.companyName,
      cnpj: clientData.cnpj,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address
    };
    
    // Salvar cada campo relevante
    const savePromises = [];
    
    if (fullName) {
      savePromises.push(saveToHistory('client_name', fullName, metadata, displayLabel));
    }
    if (clientData.companyName) {
      savePromises.push(saveToHistory('company_name', clientData.companyName, metadata, displayLabel));
    }
    if (clientData.cnpj) {
      savePromises.push(saveToHistory('cnpj', clientData.cnpj, metadata, displayLabel));
    }
    if (clientData.email) {
      savePromises.push(saveToHistory('email', clientData.email, metadata, displayLabel));
    }
    if (clientData.phone) {
      savePromises.push(saveToHistory('phone', clientData.phone, metadata, displayLabel));
    }
    
    await Promise.all(savePromises);
  }, [user, saveToHistory]);

  return { 
    getSuggestions, 
    saveToHistory, 
    removeFromHistory, 
    saveClientData,
    loading 
  };
};
