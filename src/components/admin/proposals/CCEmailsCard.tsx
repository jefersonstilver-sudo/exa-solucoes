import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CCEmailsInput } from '@/components/ui/cc-emails-input';
import { Save, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface CCEmailsCardProps {
  ccEmails: string[];
  onSave: (emails: string[]) => Promise<void>;
  isExpanded?: boolean;
}

export const CCEmailsCard: React.FC<CCEmailsCardProps> = ({ 
  ccEmails, 
  onSave,
  isExpanded = false 
}) => {
  const [emails, setEmails] = useState<string[]>(ccEmails || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (newEmails: string[]) => {
    setEmails(newEmails);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(emails);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.32 }}
    >
      <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-[#9C1E1E]" />
          <h3 className="font-semibold text-sm">E-mails de Cópia (CC)</h3>
        </div>
        
        <CCEmailsInput
          value={emails}
          onChange={handleChange}
          label=""
          placeholder="Digite um e-mail e pressione Enter"
          maxEmails={5}
        />
        
        {hasChanges && (
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 text-xs bg-[#9C1E1E] hover:bg-[#7D1818]"
            >
              <Save className="h-3 w-3 mr-1.5" />
              {isSaving ? 'Salvando...' : 'Salvar E-mails'}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default CCEmailsCard;
