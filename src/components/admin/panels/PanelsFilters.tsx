
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PanelsFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  osFilter: string;
  setOsFilter: (value: string) => void;
  orientationFilter: string;
  setOrientationFilter: (value: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const PanelsFilters: React.FC<PanelsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  osFilter,
  setOsFilter,
  orientationFilter,
  setOrientationFilter,
  viewMode,
  setViewMode
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Filtros e Busca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por código, prédio ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 min-w-[120px]">
                <Filter className="h-4 w-4 mr-2" />
                Status: {statusFilter === 'all' ? 'Todos' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('online')}>
                Online
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('offline')}>
                Offline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('maintenance')}>
                Manutenção
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 min-w-[120px]">
                SO: {osFilter === 'all' ? 'Todos' : osFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setOsFilter('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOsFilter('windows')}>
                Windows
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOsFilter('linux')}>
                Linux
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOsFilter('android')}>
                Android
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 min-w-[120px]">
                Orientação: {orientationFilter === 'all' ? 'Todas' : orientationFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setOrientationFilter('all')}>
                Todas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrientationFilter('horizontal')}>
                Horizontal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrientationFilter('vertical')}>
                Vertical
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Visualização:</span>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            Lista
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelsFilters;
