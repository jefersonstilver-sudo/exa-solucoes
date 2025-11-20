import { NavLink } from 'react-router-dom';
import { Settings, FileText, BookOpen, Zap, Eye, ArrowLeft } from 'lucide-react';
import type { Agent } from '../types/multiAgentTypes';

interface AgentSidebarProps {
  agent: Agent;
}

export const AgentSidebar = ({ agent }: AgentSidebarProps) => {
  const baseUrl = `/admin/monitoramento-ia/agentes/${agent.id}`;

  const navItems = [
    { path: `${baseUrl}/configuracoes`, icon: Settings, label: 'Configurações' },
    { path: `${baseUrl}/prompt`, icon: FileText, label: 'Prompt Base' },
    { path: `${baseUrl}/conhecimento`, icon: BookOpen, label: 'Base de Conhecimento' },
    { path: `${baseUrl}/regras`, icon: Zap, label: 'Regras de Ação' },
    { path: `${baseUrl}/preview`, icon: Eye, label: 'Preview' },
  ];

  return (
    <div className="bg-module-card border-r border-module p-4 space-y-4">
      <NavLink 
        to="/admin/monitoramento-ia/agentes"
        className="flex items-center gap-2 text-module-secondary hover:text-module-primary transition-colors text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Agentes
      </NavLink>

      <div className="pb-4 border-b border-module">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{agent.avatar}</span>
          <div>
            <h3 className="font-bold text-module-primary">{agent.name}</h3>
            <p className="text-xs text-module-tertiary capitalize">{agent.type}</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-module-accent text-white'
                  : 'text-module-secondary hover:bg-module-input hover:text-module-primary'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
