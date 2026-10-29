import React, { useEffect, useState } from 'react';

export function ConversationAvatar({ name, url, large = false }: { name: string; url?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return <span className={`crm-avatar ${large ? 'crm-avatar-large' : ''}`}>
    {url && !failed ? <img src={url} alt={name} onError={() => setFailed(true)} /> : name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'}
  </span>;
}

export function ConversationDay({ date, previous }: { date: string | number; previous?: string | number }) {
  const current = new Date(date);
  if (previous !== undefined && current.toDateString() === new Date(previous).toDateString()) return null;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const label = current.toDateString() === today.toDateString() ? 'Hoje' : current.toDateString() === yesterday.toDateString() ? 'Ontem' : current.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  return <div className="crm-day"><span>{label}</span></div>;
}