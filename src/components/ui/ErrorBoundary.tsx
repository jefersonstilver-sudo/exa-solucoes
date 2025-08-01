import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 ErrorBoundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    console.error('📋 Component Stack:', errorInfo.componentStack);
    
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Algo deu errado
            </h2>
            <p className="text-muted-foreground mb-6">
              Ocorreu um erro inesperado. Tente recarregar esta seção.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>Erro: {this.state.error?.name}</p>
              <p className="font-mono text-xs break-all">
                {this.state.error?.message}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;