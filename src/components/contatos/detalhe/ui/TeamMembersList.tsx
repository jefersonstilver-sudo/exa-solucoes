import React from 'react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  status: 'available' | 'busy' | 'offline';
}

interface TeamMembersListProps {
  members: TeamMember[];
  title?: string;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  members,
  title = 'Membros da Equipe'
}) => {
  const getStatusConfig = (status: TeamMember['status']) => {
    switch (status) {
      case 'available':
        return { label: 'Livre', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
      case 'busy':
        return { label: 'Ocupado', color: 'bg-amber-500', textColor: 'text-amber-600' };
      case 'offline':
        return { label: 'Offline', color: 'bg-gray-400', textColor: 'text-gray-500' };
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {members.map((member) => {
          const statusConfig = getStatusConfig(member.status);
          return (
            <div key={member.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {getInitials(member.name)}
                      </span>
                    </div>
                  )}
                  <span className={cn(
                    "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
                    statusConfig.color
                  )} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {member.name}
                </span>
              </div>
              <span className={cn("text-xs font-medium", statusConfig.textColor)}>
                {statusConfig.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamMembersList;
