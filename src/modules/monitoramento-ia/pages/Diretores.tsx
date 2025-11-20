import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';
import { Search, Plus } from 'lucide-react';

interface Director {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export const DiretoresPage = () => {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);

  useEffect(() => {
    fetchDirectors();
  }, []);

  const fetchDirectors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('directors')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDirectors(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-module-card rounded-xl border border-module p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary">Diretores Autorizados</h1>
            <p className="text-module-secondary">Gerenciar notificações via WhatsApp para diretores</p>
          </div>
          <button className="bg-module-accent hover-module-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-module">
            <Plus size={18} />
            Novo Diretor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-module-card border border-module rounded-lg p-4">
          <p className="text-module-secondary text-sm">Total de Diretores</p>
          <p className="text-2xl font-bold text-module-primary">{directors.length}</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-4">
          <p className="text-module-secondary text-sm">Ativos</p>
          <p className="text-2xl font-bold text-green-500">{directors.filter(d => d.is_active).length}</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-4">
          <p className="text-module-secondary text-sm">Inativos</p>
          <p className="text-2xl font-bold text-gray-500">{directors.filter(d => !d.is_active).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-module-card rounded-xl border border-module">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9C1E1E]"></div>
        </div>
      ) : (
        <div className="bg-module-card rounded-xl border border-module overflow-hidden">
          <table className="w-full">
            <thead className="bg-module-input border-b border-module">
              <tr>
                <th className="px-4 py-3 text-left text-module-primary">Nome</th>
                <th className="px-4 py-3 text-left text-module-primary">Telefone</th>
                <th className="px-4 py-3 text-left text-module-primary">Status</th>
                <th className="px-4 py-3 text-left text-module-primary">Ações</th>
              </tr>
            </thead>
            <tbody>
              {directors.map((dir) => (
                <tr key={dir.id} className="border-b border-module hover-module-bg transition-module">
                  <td className="px-4 py-3 text-module-primary">{dir.name}</td>
                  <td className="px-4 py-3 text-module-secondary">{dir.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${dir.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                      {dir.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-module-primary hover-module-bg px-2 py-1 rounded transition-module">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
