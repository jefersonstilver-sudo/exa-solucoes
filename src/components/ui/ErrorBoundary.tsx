
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ERROR BOUNDARY] Erro capturado:', error, errorInfo);
    
    // Detectar especificamente erros de hook order
    if (error.message.includes('Rendered more hooks than during the previous render')) {
      console.error('🚨 [ERROR BOUNDARY] ERRO DE HOOK ORDER DETECTADO');
      
      // Limpar storage que pode estar causando problemas
      try {
        localStorage.removeItem('indexa_cart');
        localStorage.removeItem('selectedPlan');
        console.log('🧹 [ERROR BOUNDARY] Storage limpo');
      } catch (e) {
        console.error('❌ [ERROR BOUNDARY] Erro ao limpar storage:', e);
      }
    }
    
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    // Limpar todo o estado antes de ir para home
    localStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isHookError = this.state.error?.message.includes('hooks') || 
                         this.state.error?.message.includes('render');

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {isHookError ? 'Erro de Sistema' : 'Erro no Sistema'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                {isHookError 
                  ? 'Detectamos um problema interno. Vamos resetar a aplicação para você.'
                  : 'Ocorreu um erro inesperado. Tente recarregar a página ou volte ao início.'
                }
              </p>
              
              <div className="flex flex-col space-y-2">
                {isHookError ? (
                  <Button onClick={this.handleGoHome} className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Voltar ao Início
                  </Button>
                ) : (
                  <>
                    <Button onClick={this.handleRetry} variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar Novamente
                    </Button>
                    <Button onClick={this.handleGoHome} className="w-full">
                      <Home className="h-4 w-4 mr-2" />
                      Voltar ao Início
                    </Button>
                  </>
                )}
              </div>
              
              {this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    Detalhes técnicos
                  </summary>
                  <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded max-h-32 overflow-auto">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
