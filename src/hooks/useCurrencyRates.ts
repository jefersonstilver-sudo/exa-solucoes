import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface CurrencyRate {
  code: string;
  name: string;
  buy: number;
  sell: number;
  variation: number;
  timestamp: Date;
}

interface AwesomeAPIResponse {
  [key: string]: {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
  };
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'Dólar',
  EUR: 'Euro',
  BTC: 'Bitcoin',
  ARS: 'Peso Argentino',
  PYG: 'Guarani'
};

const fetchCurrencyRates = async (): Promise<CurrencyRate[]> => {
  const response = await fetch(
    'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL,ARS-BRL,PYG-BRL'
  );
  
  if (!response.ok) {
    throw new Error('Falha ao buscar cotações');
  }
  
  const data: AwesomeAPIResponse = await response.json();
  
  return Object.entries(data).map(([key, value]) => ({
    code: value.code,
    name: CURRENCY_NAMES[value.code] || value.code,
    buy: parseFloat(value.bid),
    sell: parseFloat(value.ask),
    variation: parseFloat(value.pctChange),
    timestamp: new Date(parseInt(value.timestamp) * 1000)
  }));
};

export const useCurrencyRates = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['currencyRates'],
    queryFn: fetchCurrencyRates,
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Refetch a cada 1 minuto
    retry: 3
  });

  return {
    rates: data || [],
    loading: isLoading,
    error: error?.message || null,
    refresh: refetch
  };
};
