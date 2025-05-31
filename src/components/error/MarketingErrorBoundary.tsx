
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MarketingErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const MarketingErrorFallback: React.FC<MarketingErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  console.error('Marketing page error:', error);
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="bg-white/10 border-white/20 max-w-md w-full">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4">Erro na página de Marketing</h2>
          <p className="text-gray-300 mb-6">
            Ocorreu um erro ao carregar a página. Tente recarregar a página.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={resetErrorBoundary}
              className="w-full bg-[#00FFAB] text-black hover:bg-[#00FFAB]/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full border-white/30 text-white hover:bg-white/10"
            >
              Voltar ao início
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-400">
                Detalhes do erro (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs text-red-300 overflow-auto max-h-32">
                {error.message}
                {error.stack && '\n' + error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface MarketingErrorBoundaryProps {
  children: React.ReactNode;
}

const MarketingErrorBoundary: React.FC<MarketingErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={MarketingErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Marketing Error Boundary caught an error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default MarketingErrorBoundary;
