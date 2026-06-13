import React from 'react';

const ReportSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-32 bg-slate-200/70 rounded-2xl" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-200/70 rounded-2xl" />
      ))}
    </div>
    <div className="h-48 bg-slate-200/70 rounded-2xl" />
    <div className="h-64 bg-slate-200/70 rounded-2xl" />
    <div className="h-64 bg-slate-200/70 rounded-2xl" />
  </div>
);

export default ReportSkeleton;
