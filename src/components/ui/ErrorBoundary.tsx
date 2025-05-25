
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
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
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Erro no Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Ocorreu um erro inesperado. Tente recarregar a página ou contate o suporte.
            </p>
            <div className="flex space-x-2">
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="default" 
                size="sm"
              >
                Recarregar Página
              </Button>
            </div>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Detalhes técnicos
                </summary>
                <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
