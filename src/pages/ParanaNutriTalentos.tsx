import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Maximize2, LogOut } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const EXA_LOGO_URL =
  'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

const ACCESS_PASSWORD = '573040@';
const STORAGE_KEY = 'pnt_access_v1';
const PRESENTATION_URL =
  'https://docs.google.com/presentation/d/e/2PACX-1vSSvIePXlFmEoKPe-sJVjDZI5OWdLjzLxscj_4IuDtaqJIMwzkDgyIQmNFJOa6x926Xh0SqdUEDUjhp/embed?start=false&loop=false&delayms=3000';

const ParanaNutriTalentos: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'ok') {
      setAuthed(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setTimeout(() => {
      if (password === ACCESS_PASSWORD) {
        sessionStorage.setItem(STORAGE_KEY, 'ok');
        setAuthed(true);
      } else {
        setError(true);
        setPassword('');
      }
      setLoading(false);
    }, 600);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setPassword('');
  };

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen?.();
  };

  return (
    <>
      <Helmet>
        <title>Paraná Nutri Talentos | EXA Mídia</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <AnimatePresence mode="wait">
        {!authed ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4"
            style={{
              background:
                'radial-gradient(ellipse at top left, #2a0608 0%, #0a0203 45%, #000 100%)',
            }}
          >
            {/* Animated ambient orbs */}
            <motion.div
              className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(circle, #C7141A 0%, transparent 70%)' }}
              animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #B40D1A 0%, transparent 70%)' }}
              animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />

            {/* Card */}
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-md"
            >
              <div
                className="relative overflow-hidden rounded-3xl border border-white/10 p-10 shadow-2xl backdrop-blur-2xl"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow:
                    '0 25px 80px -20px rgba(199,20,26,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {/* Top shine */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  }}
                />

                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="flex justify-center mb-8"
                >
                  <img
                    src={EXA_LOGO_URL}
                    alt="EXA Mídia"
                    className="h-14 w-auto object-contain"
                    style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 20px rgba(199,20,26,0.4))' }}
                  />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-2xl font-light tracking-wide text-white mb-2">
                    Paraná Nutri <span className="font-semibold">Talentos</span>
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-white/40 text-xs uppercase tracking-[0.3em]">
                    <span className="h-px w-8 bg-white/20" />
                    Acesso Restrito
                    <span className="h-px w-8 bg-white/20" />
                  </div>
                </motion.div>

                {/* Form */}
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="space-y-5"
                >
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-white/40 group-focus-within:text-white/80 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(false);
                      }}
                      placeholder="Digite a senha de acesso"
                      autoFocus
                      className={`w-full bg-white/5 border rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 outline-none transition-all duration-300 focus:bg-white/10 ${
                        error
                          ? 'border-red-500/60 shake'
                          : 'border-white/10 focus:border-white/30'
                      }`}
                      style={{
                        boxShadow: error ? '0 0 0 4px rgba(239,68,68,0.1)' : 'none',
                      }}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-400 text-xs text-center"
                      >
                        Senha incorreta. Verifique e tente novamente.
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={loading || !password}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="relative w-full overflow-hidden rounded-xl py-4 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{
                      background:
                        'linear-gradient(135deg, #C7141A 0%, #B40D1A 100%)',
                      boxShadow:
                        '0 10px 30px -10px rgba(199,20,26,0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          Acessar apresentação
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </span>
                    <span
                      className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
                      }}
                    />
                  </motion.button>
                </motion.form>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-8 text-center text-[10px] uppercase tracking-[0.25em] text-white/30"
                >
                  © EXA Mídia · Conteúdo confidencial
                </motion.p>
              </div>
            </motion.div>

            <style>{`
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-6px); }
                75% { transform: translateX(6px); }
              }
              .shake { animation: shake 0.4s ease-in-out; }
            `}</style>
          </motion.div>
        ) : (
          <motion.div
            key="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen w-full bg-black flex flex-col"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-black/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <img
                  src={EXA_LOGO_URL}
                  alt="EXA"
                  className="h-7 w-auto object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
                <span className="hidden sm:block text-white/40 text-xs uppercase tracking-[0.25em]">
                  Paraná Nutri Talentos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFullscreen}
                  className="flex items-center gap-2 text-white/60 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tela cheia</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-white/60 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>

            {/* Slides */}
            <div className="flex-1 w-full bg-black p-2 sm:p-4">
              <div
                className="relative w-full h-full mx-auto rounded-xl overflow-hidden shadow-2xl"
                style={{ aspectRatio: '16 / 9', maxHeight: 'calc(100vh - 100px)' }}
              >
                <iframe
                  ref={iframeRef}
                  src={PRESENTATION_URL}
                  title="Paraná Nutri Talentos"
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ParanaNutriTalentos;
