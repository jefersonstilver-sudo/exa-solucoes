import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, LogOut } from 'lucide-react';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { KanbanBoard } from '@/components/contatos/kanban';
import { useKanbanContatos } from '@/hooks/contatos/useKanbanContatos';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ContatosKanbanPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { columns, loading, moveContact, refetch } = useKanbanContatos({
    groupBy: 'categoria',
    search: ''
  });

  // Atualiza relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determina saudação baseada na hora
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formattedDate = format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(currentTime, 'HH:mm:ss');

  if (loading && columns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white relative">
      {/* Header Simples */}
      <header className="w-full bg-white px-6 py-2 flex items-center justify-between border-b border-gray-100/50 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-gray-800 font-medium text-lg">{getGreeting()}, Jeferson</h2>
          <span className="text-xl">👋</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          columns={columns}
          onMoveContact={moveContact}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ContatosKanbanPage;
