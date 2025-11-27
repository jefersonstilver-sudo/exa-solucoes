import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useContactTypes } from '../../../hooks/useContactTypes';
import { motion } from 'framer-motion';

interface MobileCRMFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  agents: Array<{ key: string; display_name: string }>;
}

export const MobileCRMFilters: React.FC<MobileCRMFiltersProps> = ({
  filters,
  onFilterChange,
  agents
}) => {
  const [open, setOpen] = useState(false);
  const { contactTypes, loading: contactTypesLoading } = useContactTypes();

  // Contar filtros ativos
  const activeFilterCount = [
    filters.unreadOnly,
    filters.criticalOnly,
    filters.hotLeadsOnly,
    filters.awaitingOnly,
    filters.agentKey,
    filters.sentiment,
    filters.contactTypes?.length || 0
  ].filter(v => v && (typeof v === 'boolean' || v.length > 0)).length;

  // Limpar todos os filtros
  const clearAllFilters = () => {
    onFilterChange({
      agentKey: undefined,
      contactTypes: [],
      unreadOnly: false,
      criticalOnly: false,
      hotLeadsOnly: false,
      awaitingOnly: false,
      sentiment: undefined
    });
    setOpen(false);
  };

  // Toggle tipo de contato (multi-select)
  const toggleContactType = (typeName: string) => {
    const currentTypes = filters.contactTypes || [];
    const newTypes = currentTypes.includes(typeName)
      ? currentTypes.filter((t: string) => t !== typeName)
      : [...currentTypes, typeName];
    onFilterChange({ ...filters, contactTypes: newTypes });
  };

  return (
    <>
      {/* Botão Flutuante Elegante */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <motion.div
            className="fixed bottom-20 right-4 z-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Button
              size="lg"
              className={cn(
                "h-14 w-14 rounded-full shadow-lg backdrop-blur-sm transition-all",
                activeFilterCount > 0
                  ? "bg-gradient-to-r from-[#9C1E1E] to-[#D72638] text-white hover:opacity-90"
                  : "bg-gradient-to-r from-[#9C1E1E]/80 to-[#D72638]/80 text-white border-2 border-white/20 hover:opacity-90"
              )}
            >
              <Filter className="h-5 w-5" />
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-6 min-w-6 rounded-full px-1.5 bg-[#25D366] text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </motion.div>
        </SheetTrigger>

        <SheetContent side="bottom" className="pb-safe rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center justify-between">
              Filtros
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar tudo
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pb-6">
            {/* Agentes Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Agentes</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, agentKey: undefined })}
                  className={cn(
                    "h-9 px-4 text-xs",
                    !filters.agentKey && "bg-gradient-to-r from-[#9C1E1E] to-[#D72638] text-white"
                  )}
                >
                  Todos
                </Button>
                {agents.map((agent) => (
                  <Button
                    key={agent.key}
                    variant="outline"
                    size="sm"
                    onClick={() => onFilterChange({ ...filters, agentKey: agent.key })}
                    className={cn(
                      "h-9 px-4 text-xs",
                      filters.agentKey === agent.key && "bg-gradient-to-r from-[#9C1E1E] to-[#D72638] text-white"
                    )}
                  >
                    {agent.display_name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tipos de Contato Section - Multi-Select */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Tipos de Contato
                {filters.contactTypes && filters.contactTypes.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({filters.contactTypes.length} selecionados)
                  </span>
                )}
              </Label>
              {contactTypesLoading ? (
                <p className="text-sm text-muted-foreground">Carregando tipos...</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {contactTypes.map((type) => (
                    <motion.div
                      key={type.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => toggleContactType(type.name)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Checkbox
                        checked={filters.contactTypes?.includes(type.name) || false}
                        onCheckedChange={() => toggleContactType(type.name)}
                        className="pointer-events-none"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{type.icon}</span>
                        <Label className="text-sm font-normal cursor-pointer flex-1">
                          {type.label}
                        </Label>
                        {type.color && (
                          <div
                            className="w-3 h-3 rounded-full border border-border/50"
                            style={{ backgroundColor: type.color }}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Status</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                  <Label className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    💬 Não Lidas
                  </Label>
                  <Switch
                    checked={filters.unreadOnly || false}
                    onCheckedChange={(checked) => 
                      onFilterChange({ ...filters, unreadOnly: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                  <Label className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    🔴 Crítico
                  </Label>
                  <Switch
                    checked={filters.criticalOnly || false}
                    onCheckedChange={(checked) => 
                      onFilterChange({ ...filters, criticalOnly: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                  <Label className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    🔥 Hot Lead
                  </Label>
                  <Switch
                    checked={filters.hotLeadsOnly || false}
                    onCheckedChange={(checked) => 
                      onFilterChange({ ...filters, hotLeadsOnly: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                  <Label className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    ⏰ Aguardando Resposta
                  </Label>
                  <Switch
                    checked={filters.awaitingOnly || false}
                    onCheckedChange={(checked) => 
                      onFilterChange({ ...filters, awaitingOnly: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
