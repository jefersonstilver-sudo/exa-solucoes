import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

export const ConsoleIAPage = () => {
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  
  return (
    <div className="space-y-6">
      <div className={`${tc.bgCard} rounded-xl ${tc.border} border shadow-sm p-6 lg:p-8`}>
        <h1 className={`text-2xl lg:text-3xl font-bold ${tc.textPrimary} mb-4`}>
          Console da IA
        </h1>
        <p className={tc.textSecondary}>
          Página criada. Conteúdo funcional será implementado em etapas seguintes.
        </p>
      </div>
    </div>
  );
};
