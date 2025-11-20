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
      <div className={`${tc.bgCard} rounded-xl ${tc.border} border p-6`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${tc.textPrimary}`}>Diretores Autorizados</h1>
            <p className={tc.textSecondary}>Gerenciar notificações via WhatsApp para diretores</p>
          </div>
          <button className={`${tc.bgAccent} ${tc.bgAccentHover} text-white px-4 py-2 rounded-lg flex items-center gap-2`}>
            <Plus size={18} />
            Novo Diretor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${tc.bgCard} ${tc.border} border rounded-lg p-4`}>
          <p className={`${tc.textSecondary} text-sm`}>Total de Diretores</p>
          <p className={`text-2xl font-bold ${tc.textPrimary}`}>{directors.length}</p>
        </div>
        <div className={`${tc.bgCard} ${tc.border} border rounded-lg p-4`}>
          <p className={`${tc.textSecondary} text-sm`}>Ativos</p>
          <p className="text-2xl font-bold text-green-500">{directors.filter(d => d.is_active).length}</p>
        </div>
        <div className={`${tc.bgCard} ${tc.border} border rounded-lg p-4`}>
          <p className={`${tc.textSecondary} text-sm`}>Inativos</p>
          <p className="text-2xl font-bold text-gray-500">{directors.filter(d => !d.is_active).length}</p>
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-12 ${tc.bgCard} rounded-xl ${tc.border} border`}>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9C1E1E]"></div>
        </div>
      ) : (
        <div className={`${tc.bgCard} rounded-xl ${tc.border} border overflow-hidden`}>
          <table className="w-full">
            <thead className={`${tc.bgInput} ${tc.border} border-b`}>
              <tr>
                <th className={`px-4 py-3 text-left ${tc.textPrimary}`}>Nome</th>
                <th className={`px-4 py-3 text-left ${tc.textPrimary}`}>Telefone</th>
                <th className={`px-4 py-3 text-left ${tc.textPrimary}`}>Status</th>
                <th className={`px-4 py-3 text-left ${tc.textPrimary}`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {directors.map((dir) => (
                <tr key={dir.id} className={`${tc.border} border-b ${tc.bgHover}`}>
                  <td className={`px-4 py-3 ${tc.textPrimary}`}>{dir.name}</td>
                  <td className={`px-4 py-3 ${tc.textSecondary}`}>{dir.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${dir.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                      {dir.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className={`${tc.textPrimary} ${tc.bgHover} px-2 py-1 rounded`}>Editar</button>
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
