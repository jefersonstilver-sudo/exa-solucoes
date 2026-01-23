import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Briefcase, Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessSegments } from '@/hooks/useBusinessSegments';

interface BusinessSegmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  showLabel?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowCreate?: boolean;
}

export const BusinessSegmentSelector: React.FC<BusinessSegmentSelectorProps> = ({ 
  value, 
  onChange,
  showLabel = true,
  label = 'Segmento de Negócio',
  placeholder = 'Selecione o segmento',
  required = false,
  className,
  allowCreate = true
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSegmentLabel, setNewSegmentLabel] = useState('');
  
  const { segments, isLoading, createSegment, isCreating, getLabelByValue } = useBusinessSegments();

  const selectedSegment = segments.find(segment => segment.value === value);
  const selectedLabel = selectedSegment?.label || getLabelByValue(value);

  const handleCreateSegment = async () => {
    if (!newSegmentLabel.trim()) return;

    try {
      const newSegment = await createSegment({ label: newSegmentLabel.trim() });
      onChange(newSegment.value);
      setCreateDialogOpen(false);
      setNewSegmentLabel('');
      setOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleOpenCreateDialog = () => {
    setNewSegmentLabel(searchValue);
    setCreateDialogOpen(true);
  };

  // Filter segments based on search
  const filteredSegments = searchValue
    ? segments.filter(s => 
        s.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.value.toLowerCase().includes(searchValue.toLowerCase())
      )
    : segments;

  const showCreateOption = allowCreate && searchValue.length >= 2 && 
    !segments.some(s => s.label.toLowerCase() === searchValue.toLowerCase());

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <Label htmlFor="businessSegment" className="flex items-center text-sm font-medium">
          <Briefcase className="h-4 w-4 mr-2 text-primary" />
          {label} {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 bg-background border-input hover:bg-accent"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="text-muted-foreground">Carregando...</span>
            ) : value && selectedLabel ? (
              selectedLabel
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Command className="bg-popover">
            <CommandInput 
              placeholder="Digite para buscar..." 
              className="h-11 border-none focus:ring-0"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              {!isLoading && filteredSegments.length === 0 && !showCreateOption && (
                <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
              )}
              
              {/* Create new segment option */}
              {showCreateOption && (
                <CommandGroup heading="Criar novo">
                  <CommandItem
                    onSelect={handleOpenCreateDialog}
                    className="cursor-pointer text-primary hover:bg-accent"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar "{searchValue}"
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Existing segments */}
              <CommandGroup heading={showCreateOption ? "Existentes" : undefined}>
                {filteredSegments.map((segment) => (
                  <CommandItem
                    key={segment.value}
                    value={segment.label}
                    onSelect={() => {
                      onChange(segment.value);
                      setOpen(false);
                      setSearchValue('');
                    }}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === segment.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {segment.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Novo Segmento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newSegmentLabel">Nome do Segmento *</Label>
              <Input
                id="newSegmentLabel"
                value={newSegmentLabel}
                onChange={(e) => setNewSegmentLabel(e.target.value)}
                placeholder="Ex: Academia 24h, Clínica Veterinária..."
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                O segmento será disponibilizado em todo o sistema automaticamente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSegment}
              disabled={!newSegmentLabel.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Segmento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Export for backwards compatibility
export default BusinessSegmentSelector;
