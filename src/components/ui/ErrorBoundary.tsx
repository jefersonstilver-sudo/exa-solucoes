
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
  errorDetails?: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('🚨 [ERROR BOUNDARY] Erro capturado:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ERROR BOUNDARY] Detalhes do erro:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    // Detectar tipos específicos de erro
    let errorDetails = '';
    
    if (error.message.includes('Rendered more hooks than during the previous render')) {
      errorDetails = 'Erro de Hook Order - componente renderizando hooks condicionalmente';
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      errorDetails = 'Tabela do banco de dados não encontrada';
    } else if (error.message.includes('supabase')) {
      errorDetails = 'Erro de conexão com Supabase';
    } else if (error.message.includes('ChunkLoadError')) {
      errorDetails = 'Erro de carregamento de módulo';
    } else if (error.message.includes('React')) {
      errorDetails = 'Erro de renderização React';
    } else {
      errorDetails = error.message;
    }
    
    this.setState({ 
      errorInfo, 
      errorDetails
    });
    
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    console.log('🔄 [ERROR BOUNDARY] Tentando recuperar...');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorDetails: undefined });
  };

  private handleGoHome = () => {
    console.log('🏠 [ERROR BOUNDARY] Voltando para home...');
    localStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Erro no Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Ocorreu um erro inesperado na aplicação.
              </p>
              
              {this.state.errorDetails && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-700 font-medium">Detalhes:</p>
                  <p className="text-sm text-red-600">{this.state.errorDetails}</p>
                </div>
              )}
              
              <div className="flex flex-col space-y-2">
                <Button onClick={this.handleRetry} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button onClick={this.handleGoHome} className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar ao Início
                </Button>
              </div>
              
              {this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    Detalhes técnicos (clique para expandir)
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
