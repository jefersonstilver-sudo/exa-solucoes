import React from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface MobileSortDialogProps {
  sortOption: string;
  onSortChange: (value: string) => void;
  hasLocationSearch: boolean;
}

const MobileSortDialog: React.FC<MobileSortDialogProps> = ({
  sortOption,
  onSortChange,
  hasLocationSearch
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const sortOptions = [
    ...(hasLocationSearch ? [{ value: 'distance', label: 'Distância', icon: '📍' }] : []),
    { value: 'airbnb', label: 'Airbnb primeiro', icon: '🏠' },
    { value: 'audience-desc', label: 'Maior Público', icon: '👥' },
    { value: 'price-asc', label: 'Menor Preço', icon: '💰' },
    { value: 'price-desc', label: 'Maior Preço', icon: '💎' },
    ...(!hasLocationSearch ? [{ value: 'relevance', label: 'Relevância', icon: '⭐' }] : []),
  ];

  const handleOptionSelect = (value: string) => {
    onSortChange(value);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center justify-center bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-[#9C1E1E] transition-all h-11 w-11 rounded-lg shadow-sm p-0"
        >
          <ArrowUpDown className="h-5 w-5 text-gray-700" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center space-x-2 text-lg">
            <ArrowUpDown className="h-5 w-5 text-gray-700" />
            <span>Ordenar por</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2 pb-6">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={sortOption === option.value ? "default" : "outline"}
              className={`w-full justify-between h-12 text-left ${
                sortOption === option.value 
                  ? 'bg-[#9C1E1E] text-white hover:bg-[#8a1919]' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => handleOptionSelect(option.value)}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </span>
              {sortOption === option.value && (
                <Check className="h-5 w-5" />
              )}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSortDialog;
