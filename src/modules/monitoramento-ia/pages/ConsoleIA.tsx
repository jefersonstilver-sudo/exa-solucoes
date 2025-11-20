import { useModuleTheme } from '../hooks/useModuleTheme';

export const ConsoleIAPage = () => {
  const { theme } = useModuleTheme();
  
  return (
    <div className="space-y-6">
      <div className="bg-module-card rounded-[14px] border border-module shadow-sm p-6 lg:p-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-4">
          Console da IA
        </h1>
        <p className="text-module-secondary">
          Página criada. Conteúdo funcional será implementado em etapas seguintes.
        </p>
      </div>
    </div>
  );
};
