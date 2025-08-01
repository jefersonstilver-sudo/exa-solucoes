import React, { useState } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { Eye, EyeOff, Lock } from 'lucide-react';

const ComingSoonPage = () => {
  const launchDate = new Date('2025-08-10T00:00:00');
  const timeLeft = useCountdown(launchDate);
  const { 
    password, 
    setPassword, 
    showPasswordField, 
    setShowPasswordField, 
    authenticateUser 
  } = useDeveloperAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticateUser(password)) {
      window.location.reload(); // Reload to access the main site
    } else {
      setError('Senha incorreta');
      setPassword('');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indexa-purple via-indexa-purple-dark to-black flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indexa-mint/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indexa-purple/20 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indexa-mint/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Three Brand Logos */}
        <div className="mb-12 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* INDEXA Logo (larger, parent brand) */}
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <UnifiedLogo 
                size="custom" 
                variant="light"
                className="w-56 h-56 filter brightness-0 invert hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* LINKAE Logo */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <img 
                src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTM4MTQ3OTksImV4cCI6OTYzNjE4MTQ3OTl9.ERz9rbEWAs_6Ep6BXI5ErN9ixotyUMb3szh2klNK4Us"
                alt="LINKAÊ Logo" 
                className="w-40 h-40 object-contain filter brightness-0 invert hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* EXA Logo */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <img 
                src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1MzkyNDY3NywiZXhwIjoxNzg1NDYwNjc3fQ.Obullg6SYYcT2j1mmJgZ4MIL-_9lqNDHmImhft_ZbmM"
                alt="EXA Logo" 
                className="w-40 h-40 object-contain filter brightness-0 invert hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-xl md:text-2xl text-indexa-mint mb-4 font-exo-2">
            Em breve
          </p>
          <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
            Lançamento Oficial do nosso site <span className="text-indexa-mint font-semibold">10 de agosto de 2025</span>
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-16 animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto">
            {[
              { value: timeLeft.days, label: 'Dias' },
              { value: timeLeft.hours, label: 'Horas' },
              { value: timeLeft.minutes, label: 'Minutos' },
              { value: timeLeft.seconds, label: 'Segundos' }
            ].map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20">
                <div className="text-3xl md:text-5xl font-bold text-white font-orbitron mb-2">
                  {item.value.toString().padStart(2, '0')}
                </div>
                <div className="text-sm md:text-base text-indexa-mint uppercase tracking-wide">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developer Access */}
        <div className="animate-slide-in" style={{ animationDelay: '0.6s' }}>
          {!showPasswordField ? (
            <button
              onClick={() => setShowPasswordField(true)}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors text-sm"
            >
              <Lock className="w-4 h-4" />
              Acesso para desenvolvedores
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="max-w-sm mx-auto">
              <div className="relative mb-4">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-indexa-mint hover:bg-indexa-mint/90 text-black font-semibold flex-1"
                >
                  Entrar
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowPasswordField(false);
                    setPassword('');
                    setError('');
                  }}
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-white/40 text-sm animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <p>© 2025 INDEXA. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;