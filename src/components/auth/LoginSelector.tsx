
import React from 'react';
import LoginModeToggle from './login-selector/LoginModeToggle';
import LoginFormFields from './login-selector/LoginFormFields';
import LoginSubmitButton from './login-selector/LoginSubmitButton';
import { useLoginLogic } from './login-selector/useLoginLogic';

interface LoginSelectorProps {
  onLoginSuccess?: () => void;
}

const LoginSelector: React.FC<LoginSelectorProps> = ({ onLoginSuccess }) => {
  const {
    mode,
    email,
    password,
    loading,
    showPassword,
    toggleMode,
    setEmail,
    setPassword,
    setShowPassword,
    handleLogin
  } = useLoginLogic({ onLoginSuccess });

  return (
    <div className="absolute right-0 top-[60px] w-[350px] bg-gradient-to-br from-exa-red via-exa-red/90 to-exa-red/80 rounded-xl shadow-xl overflow-hidden z-50">
      <div className="p-5 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Acesso ao Sistema
          </h2>
          
          <LoginModeToggle mode={mode} onToggle={toggleMode} />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <LoginFormFields
            email={email}
            password={password}
            showPassword={showPassword}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          
          <LoginSubmitButton loading={loading} />
        </form>
        
        {/* REMOVIDO: Copyright duplicado - apenas o footer principal do Layout deve ter copyright */}
      </div>
    </div>
  );
};

export default LoginSelector;
