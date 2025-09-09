import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import PageTransitionLoader from '@/components/loading/PageTransitionLoader';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';
import { usePageTransition } from '@/hooks/usePageTransition';
import { useLoadingState } from '@/hooks/useLoadingState';

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppContent: React.FC<AppWrapperProps> = ({ children }) => {
  const { isLoading, loadingMessage } = usePageTransition({
    minLoadingTime: 300,
    transitionDelay: 50
  });
  
  const { isGlobalLoading, loadingMessage: globalMessage, loadingProgress, showProgress } = useLoadingState();

  // Mostrar loading global se ativo
  if (isGlobalLoading) {
    return (
      <GlobalLoadingPage 
        message={globalMessage}
        showProgress={showProgress}
        progress={loadingProgress}
      />
    );
  }

  // Mostrar transições entre páginas
  return (
    <PageTransitionLoader isLoading={isLoading} loadingMessage={loadingMessage}>
      <Suspense fallback={<GlobalLoadingPage message="Carregando componente..." />}>
        {children}
      </Suspense>
    </PageTransitionLoader>
  );
};

const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <AppContent>{children}</AppContent>
      </div>
    </BrowserRouter>
  );
};

export default AppWrapper;