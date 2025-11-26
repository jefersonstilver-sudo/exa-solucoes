import React, { useState } from 'react';
import { 
  Home, 
  PieChart, 
  Users, 
  FolderKanban, 
  CheckSquare,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dados de cada página
const pageContent = {
  Dashboard: {
    title: 'Dashboard',
    description: 'Bem-vindo de volta. Aqui está o resumo do dia.',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="exa-content-card">
          <h2 className="text-lg font-semibold text-[var(--exa-text-primary)]">Projetos Ativos</h2>
          <p className="text-4xl font-bold mt-2 text-[var(--exa-accent)]">12</p>
        </div>
        <div className="exa-content-card">
          <h2 className="text-lg font-semibold text-[var(--exa-text-primary)]">Tarefas Pendentes</h2>
          <p className="text-4xl font-bold mt-2 text-[var(--exa-accent)]">5</p>
        </div>
        <div className="exa-content-card">
          <h2 className="text-lg font-semibold text-[var(--exa-text-primary)]">Novos Usuários</h2>
          <p className="text-4xl font-bold mt-2 text-[var(--exa-success)]">28</p>
        </div>
      </div>
    )
  },
  Analytics: {
    title: 'Analytics',
    description: 'Insights detalhados e métricas dos seus projetos.',
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="exa-content-card lg:col-span-2 h-64 flex items-center justify-center">
          <p className="text-[var(--exa-text-muted)]">Gráfico de Crescimento de Usuários</p>
        </div>
        <div className="exa-content-card">
          <h2 className="text-lg font-semibold text-[var(--exa-text-primary)]">Taxa de Rejeição</h2>
          <p className="text-4xl font-bold mt-2 text-[var(--exa-accent)]">24.5%</p>
        </div>
        <div className="exa-content-card">
          <h2 className="text-lg font-semibold text-[var(--exa-text-primary)]">Duração da Sessão</h2>
          <p className="text-4xl font-bold mt-2 text-[var(--exa-accent)]">8m 12s</p>
        </div>
      </div>
    )
  },
  Users: {
    title: 'Usuários',
    description: 'Gerencie todos os usuários da organização.',
    content: (
      <div className="exa-content-card overflow-hidden">
        <table className="exa-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Função</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Jane Doe</td><td>jane.doe@example.com</td><td>Admin</td></tr>
            <tr><td>John Smith</td><td>john.smith@example.com</td><td>Desenvolvedor</td></tr>
            <tr><td>Sam Wilson</td><td>sam.wilson@example.com</td><td>Designer</td></tr>
          </tbody>
        </table>
      </div>
    )
  },
  Projects: {
    title: 'Projetos',
    description: 'Visão geral de todos os seus projetos em andamento.',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="exa-content-card">
          <h2 className="text-lg font-semibold text-[var(--exa-text-primary)]">Projeto Alpha</h2>
          <p className="text-sm text-[var(--exa-text-muted)] mt-1">Status: Em Progresso</p>
        </div>
        <div className="exa-content-card">
          <h2 className="text-lg font-semibold text-[var(--exa-text-primary)]">Projeto Beta</h2>
          <p className="text-sm text-[var(--exa-success)] mt-1">Status: Concluído</p>
        </div>
      </div>
    )
  },
  Tasks: {
    title: 'Tarefas',
    description: 'Acompanhe e gerencie todas as suas tarefas.',
    content: (
      <div className="exa-content-card">
        <ul>
          <li className="exa-task-item">
            <span>Finalizar relatório Q3</span>
            <span className="text-xs text-[var(--exa-accent)]">Vence Amanhã</span>
          </li>
          <li className="exa-task-item">
            <span>Criar mockups da landing page</span>
            <span className="text-xs text-[var(--exa-text-muted)]">Em Progresso</span>
          </li>
          <li className="exa-task-item">
            <span>Deploy das atualizações</span>
            <span className="text-xs text-[var(--exa-success)]">Concluído</span>
          </li>
        </ul>
      </div>
    )
  }
};

type PageKey = keyof typeof pageContent;

const navItems: { page: PageKey; icon: React.ReactNode }[] = [
  { page: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { page: 'Analytics', icon: <PieChart className="w-5 h-5" /> },
  { page: 'Users', icon: <Users className="w-5 h-5" /> },
  { page: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
  { page: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
];

// Sidebar Component
const Sidebar = ({ activePage, setActivePage }: { 
  activePage: PageKey; 
  setActivePage: (page: PageKey) => void 
}) => (
  <aside className="exa-glass w-64 flex-shrink-0 flex flex-col z-10 border-r border-[var(--exa-border)]">
    {/* Logo */}
    <div className="h-20 flex items-center justify-center border-b border-[var(--exa-border)]">
      <div className="flex items-center gap-2">
        <Layers className="w-8 h-8 text-[var(--exa-accent)]" />
        <span className="text-xl font-bold text-[var(--exa-text-primary)]">EXA Monitor</span>
      </div>
    </div>
    
    {/* Navigation */}
    <nav className="flex-grow p-4 space-y-2">
      {navItems.map(item => (
        <a
          key={item.page}
          href="#"
          className={cn(
            "exa-nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            activePage === item.page && "active"
          )}
          onClick={(e) => {
            e.preventDefault();
            setActivePage(item.page);
          }}
        >
          {item.icon}
          <span className="font-medium">{item.page}</span>
        </a>
      ))}
    </nav>
    
    {/* User */}
    <div className="p-4 border-t border-[var(--exa-border)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--exa-accent)] flex items-center justify-center text-white font-semibold">
          S
        </div>
        <div>
          <p className="font-semibold text-[var(--exa-text-primary)]">Serafim P.</p>
          <p className="text-xs text-[var(--exa-text-muted)]">Administrador</p>
        </div>
      </div>
    </div>
  </aside>
);

// Main Content Component
const MainContent = ({ activePage }: { activePage: PageKey }) => {
  const { title, description, content } = pageContent[activePage];
  return (
    <main className="flex-grow p-8 overflow-auto">
      <h1 className="text-3xl font-bold text-[var(--exa-text-primary)]">{title}</h1>
      <p className="text-[var(--exa-text-secondary)] mt-2">{description}</p>
      <div className="mt-8">{content}</div>
    </main>
  );
};

// Main Dashboard Layout Component
export const ExaDashboardLayout = () => {
  const [activePage, setActivePage] = useState<PageKey>('Dashboard');
  
  return (
    <div className="relative min-h-screen w-full flex bg-[var(--exa-bg-primary)] text-[var(--exa-text-primary)]">
      {/* Decorative shapes */}
      <div className="exa-shape-1"></div>
      <div className="exa-shape-2"></div>
      
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <MainContent activePage={activePage} />
    </div>
  );
};

export default ExaDashboardLayout;
