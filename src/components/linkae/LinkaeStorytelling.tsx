import React from 'react';

const LinkaeStorytelling: React.FC = () => {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_20%_50%,hsl(var(--linkae-primary))_0%,transparent_50%)] opacity-30"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,hsl(var(--linkae-accent))_0deg,transparent_60deg,hsl(var(--linkae-cyan))_120deg,transparent_180deg)] opacity-20"></div>
      
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="text-center backdrop-blur-sm bg-white/5 rounded-3xl p-8 md:p-12 border border-white/10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white font-playfair animate-fade-in">
            A Dor de Todo Empresário: <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent animate-pulse-soft font-orbitron tracking-wider">"Não Sei o Que Postar"</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-linkae-accent to-linkae-cyan mx-auto mt-6 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeStorytelling;
