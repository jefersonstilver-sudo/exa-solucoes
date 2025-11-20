import React from 'react';
import { useConversations } from '../hooks/useConversations';
import { ConversationList } from '../components/conversations/ConversationList';
import { ConversationDetail } from '../components/conversations/ConversationDetail';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CRMHeader } from '../components/crm/CRMHeader';
import { CRMMetrics } from '../types/crmTypes';

export const ConversasCRMEnhanced: React.FC = () => {
  const {
    conversations,
    messages,
    loading,
    messagesLoading,
    selectedConversation,
    selectConversation,
    refetch,
  } = useConversations();

  const metrics: CRMMetrics = {
    total: conversations.length,
    unread: conversations.filter(c => c.unread_count > 0).length,
    today: conversations.filter(c => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(c.last_message_at) >= today;
    }).length,
    responseRate: 0,
    avgResponseTime: 0
  };

  const [phoneNumber, agentKey] = selectedConversation?.split('_') || [null, null];

  return (
    <div className="space-y-6 p-6">
      <CRMHeader
        metrics={metrics}
        filters={{}}
        onFilterChange={() => {}}
        onRefresh={refetch}
      />

      <div className="bg-card rounded-lg border overflow-hidden h-[calc(100vh-280px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          <div className="lg:col-span-1 border-r">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelect={selectConversation}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-2">
            <ConversationDetail
              messages={messages}
              loading={messagesLoading}
              phoneNumber={phoneNumber}
              agentKey={agentKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
