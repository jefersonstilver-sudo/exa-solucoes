import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Megaphone, 
  Cog, 
  Headphones, 
  Code, 
  DollarSign, 
  Globe, 
  Bot, 
  Building,
  Network,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useDepartments } from '@/hooks/processos';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import ModernAdminLayout from '@/components/admin/layout/ModernAdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  TrendingUp,
  Megaphone,
  Cog,
  Headphones,
  Code,
  DollarSign,
  Globe,
  Bot,
  Building,
};

const ProcessosPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { departments, loading } = useDepartments();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDepartmentClick = (departmentId: string) => {
    navigate(buildPath(`processos/${departmentId}`));
  };

  return (
    <ModernAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="p-4 md:p-6">
            <div className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Processos & Operação
                  </h1>
                  <p className="text-xs text-gray-500">
                    Centro de processos corporativos
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar departamento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white/60 border-gray-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <p className="text-2xl font-bold text-gray-900">
                {departments.length}
              </p>
              <p className="text-xs text-gray-500">Departamentos</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <p className="text-2xl font-bold text-gray-900">
                {departments.reduce((acc, d) => acc + (d.process_count || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Processos Ativos</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <p className="text-2xl font-bold text-emerald-600">98%</p>
              <p className="text-xs text-gray-500">Documentados</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <p className="text-2xl font-bold text-blue-600">v1.0</p>
              <p className="text-xs text-gray-500">Versão Atual</p>
            </motion.div>
          </div>

          {/* Departments Grid */}
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Áreas da Empresa
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepartments.map((dept, index) => {
                const IconComponent = iconMap[dept.icon] || Building;
                
                return (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDepartmentClick(dept.id)}
                    className="group cursor-pointer"
                  >
                    <div 
                      className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-5"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: dept.color
                      }}
                    >
                      {/* Background gradient on hover */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                        style={{ backgroundColor: dept.color }}
                      />
                      
                      <div className="relative flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110"
                            style={{ 
                              backgroundColor: `${dept.color}15`,
                            }}
                          >
                            <IconComponent 
                              className="h-5 w-5 transition-colors"
                              style={{ color: dept.color }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm group-hover:text-gray-800">
                              {dept.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {dept.process_count || 0} processos ativos
                            </p>
                          </div>
                        </div>
                        
                        {/* Process count badge */}
                        <div 
                          className="flex items-center justify-center min-w-[28px] h-7 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: dept.color }}
                        >
                          {dept.process_count || 0}
                        </div>
                      </div>

                      {/* Quick action hint */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Clique para ver processos
                        </span>
                        <motion.div
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={{ x: -10 }}
                          whileHover={{ x: 0 }}
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty state for search */}
          {!loading && filteredDepartments.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Nenhum departamento encontrado para "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>
    </ModernAdminLayout>
  );
};

export default ProcessosPage;
