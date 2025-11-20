import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tags, Plus, X } from 'lucide-react';
import { useConversationTags } from '../../hooks/useConversationTags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConversationTagsProps {
  phoneNumber: string;
  agentKey: string;
}

const TAG_COLORS = [
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F59E0B', label: 'Laranja' },
  { value: '#10B981', label: 'Verde' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6B7280', label: 'Cinza' }
];

export const ConversationTags: React.FC<ConversationTagsProps> = ({
  phoneNumber,
  agentKey
}) => {
  const { availableTags, assignedTags, createTag, assignTag, removeTag } = useConversationTags(phoneNumber, agentKey);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag(newTagName, newTagColor);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0].value);
    setShowCreateTag(false);
  };

  const unassignedTags = availableTags.filter(
    t => !assignedTags.find(at => at.id === t.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Tags className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold">Tags</h3>
      </div>

      {/* Assigned Tags */}
      <div className="flex flex-wrap gap-2">
        {assignedTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tag atribuída</p>
        ) : (
          assignedTags.map((tag) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color }}
              className="text-white gap-1"
            >
              {tag.name}
              <X
                className="w-3 h-3 cursor-pointer hover:opacity-70"
                onClick={() => removeTag(tag.id)}
              />
            </Badge>
          ))
        )}
      </div>

      {/* Add Tag Dialog */}
      {unassignedTags.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {unassignedTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => assignTag(tag.id)}
                >
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create New Tag */}
      {showCreateTag ? (
        <div className="space-y-2 p-3 border rounded">
          <Input
            placeholder="Nome da tag..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <Select value={newTagColor} onValueChange={setNewTagColor}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAG_COLORS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }} />
                    {c.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateTag} className="flex-1">
              Criar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreateTag(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowCreateTag(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Nova Tag
        </Button>
      )}
    </div>
  );
};
