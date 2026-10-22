import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-5 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="w-10 h-10 rounded-xl bg-slate-800"></div>
      <div className="w-16 h-5 rounded-full bg-slate-800"></div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="w-24 h-3 rounded bg-slate-800"></div>
      <div className="w-32 h-6 rounded bg-slate-700"></div>
    </div>
  </div>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-72' }) => (
  <div className={`rounded-xl bg-[#111726] border border-[#1e293b] p-6 animate-pulse ${height} flex flex-col justify-between`}>
    <div className="w-48 h-5 rounded bg-slate-800"></div>
    <div className="h-44 w-full rounded bg-slate-850/50 flex items-end gap-3 px-4">
      <div className="w-1/6 h-24 bg-slate-800 rounded-t"></div>
      <div className="w-1/6 h-36 bg-slate-800 rounded-t"></div>
      <div className="w-1/6 h-20 bg-slate-800 rounded-t"></div>
      <div className="w-1/6 h-40 bg-slate-800 rounded-t"></div>
      <div className="w-1/6 h-28 bg-slate-800 rounded-t"></div>
      <div className="w-1/6 h-32 bg-slate-800 rounded-t"></div>
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6 animate-pulse space-y-4">
    <div className="flex justify-between">
      <div className="w-40 h-5 rounded bg-slate-800"></div>
      <div className="w-24 h-8 rounded bg-slate-800"></div>
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 w-full rounded bg-slate-800/60"></div>
      ))}
    </div>
  </div>
);
