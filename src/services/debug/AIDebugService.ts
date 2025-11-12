import { supabase } from '@/integrations/supabase/client';

export interface AIDebugAnalysis {
  id: string;
  page_path: string;
  page_url: string;
  ai_analysis: any;
  error_count: number;
  error_severity: string;
  tokens_used: number;
  analysis_duration_ms: number;
  created_at: string;
}

export class AIDebugService {
  /**
   * Check if AI Debug is enabled globally
   */
  static async isDebugAIEnabled(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('debug_ai_enabled')
        .limit(1)
        .single();

      if (error) {
        console.error('Error checking debug AI status:', error);
        return false;
      }

      return data?.debug_ai_enabled || false;
    } catch (error) {
      console.error('Error in isDebugAIEnabled:', error);
      return false;
    }
  }

  /**
   * Get cached analysis for a specific page
   */
  static getCachedAnalysis(pagePath: string): any | null {
    try {
      const cacheKey = `ai-debug-${pagePath}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Cache válido por 1 hora
        if (cacheAge < 3600000) {
          return cachedData.analysis;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    
    return null;
  }

  /**
   * Save analysis to cache
   */
  static saveToCache(pagePath: string, analysis: any): void {
    try {
      const cacheKey = `ai-debug-${pagePath}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        analysis,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  /**
   * Clear all cached analyses
   */
  static clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ai-debug-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get recent analyses from database
   */
  static async getRecentAnalyses(limit: number = 10): Promise<AIDebugAnalysis[]> {
    try {
      const { data, error } = await supabase
        .from('ai_debug_analysis_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent analyses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentAnalyses:', error);
      return [];
    }
  }

  /**
   * Get analysis statistics
   */
  static async getStatistics(): Promise<{
    totalAnalyses: number;
    totalErrors: number;
    totalTokens: number;
    avgDuration: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_debug_analysis_history')
        .select('error_count, tokens_used, analysis_duration_ms');

      if (error) {
        console.error('Error fetching statistics:', error);
        return {
          totalAnalyses: 0,
          totalErrors: 0,
          totalTokens: 0,
          avgDuration: 0,
        };
      }

      const totalAnalyses = data?.length || 0;
      const totalErrors = data?.reduce((sum, item) => sum + (item.error_count || 0), 0) || 0;
      const totalTokens = data?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0;
      const avgDuration = totalAnalyses > 0
        ? Math.round(data.reduce((sum, item) => sum + (item.analysis_duration_ms || 0), 0) / totalAnalyses)
        : 0;

      return {
        totalAnalyses,
        totalErrors,
        totalTokens,
        avgDuration,
      };
    } catch (error) {
      console.error('Error in getStatistics:', error);
      return {
        totalAnalyses: 0,
        totalErrors: 0,
        totalTokens: 0,
        avgDuration: 0,
      };
    }
  }
}
