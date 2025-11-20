import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

export const BaseAgentePage = () => {
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  
  return (
    <div className={`${tc.bgCard} rounded-xl ${tc.border} border shadow-sm p-6 lg:p-8`}>
      <h1 className={`text-2xl lg:text-3xl font-bold ${tc.textPrimary} mb-4`}>
        Base da Agente
      </h1>
      <p className={tc.textSecondary}>
        Página criada. Conteúdo funcional será implementado em etapas seguintes.
      </p>
    </div>
  );
};
