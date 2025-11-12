import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIAnalysis {
  summary: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  detectedComponents: Array<{
    name: string;
    path: string;
    type: string;
    dependencies: string[];
  }>;
  detectedHooks: Array<{
    name: string;
    usage: string;
    potentialIssues: string[];
  }>;
  detectedApis: Array<{
    endpoint: string;
    method: string;
    status: string;
  }>;
  errors: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    affectedFiles: string[];
    errorDetails: string;
    suggestedFix: string;
    codeExample?: string;
    sqlQuickFix?: string;
  }>;
  suggestions: Array<{
    title: string;
    description: string;
    priority: string;
    implementation: string;
  }>;
  performanceIssues: Array<{
    issue: string;
    impact: string;
    recommendation: string;
  }>;
  securityConcerns: Array<{
    concern: string;
    risk: string;
    mitigation: string;
  }>;
}

export const useAIDebug = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  const collectPageData = useCallback(() => {
    setCurrentStep('Coletando código da página...');
    setProgress(20);

    return {
      components: window.location.pathname.split('/').filter(Boolean),
      hooks: ['useState', 'useEffect', 'useAuth', 'useToast'],
      services: ['supabase', 'checkoutService'],
      pageState: {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      },
      consoleLogs: [],
      networkCalls: [],
      performanceMetrics: {
        loadTime: performance.now(),
        domNodes: document.querySelectorAll('*').length,
      },
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      browserInfo: {
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
      },
    };
  }, []);

  const analyzeCurrentPage = useCallback(async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setAnalysis(null);

    try {
      // Check cache first
      const cacheKey = `ai-debug-${window.location.pathname}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Cache válido por 1 hora
        if (cacheAge < 3600000) {
          setCurrentStep('Carregando análise do cache...');
          setProgress(100);
          setAnalysis(cachedData.analysis);
          setIsAnalyzing(false);
          
          toast({
            title: '✓ Análise Carregada do Cache',
            description: 'Análise anterior encontrada e carregada instantaneamente.',
          });
          return;
        }
      }

      // Collect data
      const pageData = collectPageData();

      setCurrentStep('Enviando para IA...');
      setProgress(40);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('analyze-page-debug', {
        body: {
          pagePath: window.location.pathname,
          pageUrl: window.location.href,
          ...pageData,
        },
      });

      if (error) {
        throw error;
      }

      setCurrentStep('Analisando com Gemini...');
      setProgress(70);

      await new Promise(resolve => setTimeout(resolve, 500)); // UX delay

      setCurrentStep('Salvando análise...');
      setProgress(90);

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis);
        
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          analysis: data.analysis,
          timestamp: Date.now(),
        }));

        setCurrentStep('Concluído!');
        setProgress(100);

        toast({
          title: '✓ Análise Concluída',
          description: `${data.analysis.summary?.totalIssues || 0} problemas detectados. ${data.tokensUsed} tokens usados.`,
        });
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error: any) {
      console.error('AI Debug error:', error);
      
      toast({
        title: '✗ Erro na Análise',
        description: error.message || 'Falha ao analisar página com IA',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [collectPageData, toast]);

  const getCachedAnalysis = useCallback((pagePath: string): AIAnalysis | null => {
    const cacheKey = `ai-debug-${pagePath}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const cachedData = JSON.parse(cached);
      const cacheAge = Date.now() - cachedData.timestamp;
      
      if (cacheAge < 3600000) {
        return cachedData.analysis;
      }
    }
    
    return null;
  }, []);

  return {
    isAnalyzing,
    progress,
    currentStep,
    analysis,
    analyzeCurrentPage,
    getCachedAnalysis,
  };
};
