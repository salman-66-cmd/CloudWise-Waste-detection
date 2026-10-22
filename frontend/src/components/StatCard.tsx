import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  badgeText?: string;
  badgeColor?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';
  subtext?: string;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  badgeText,
  badgeColor = 'blue',
  subtext
}) => {
  const badgeClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }[badgeColor];

  const iconContainerClasses = {
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  }[badgeColor];

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#111726] border border-[#1e293b] p-5 hover:border-blue-500/30 transition-all duration-200 group">
      {/* Background watermark icon */}
      <div className="absolute -bottom-2 -right-2 text-slate-800/20 group-hover:text-blue-500/10 transition-colors pointer-events-none">
        <Icon className="w-20 h-20" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        {/* Top left Icon Container */}
        <div className={`p-2.5 rounded-xl ${iconContainerClasses}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Top right Delta Badge */}
        {badgeText && (
          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${badgeClasses}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-4 relative z-10">
        <div className="text-xs font-medium text-slate-400">{title}</div>
        <div className="text-2xl font-bold text-white mt-1 tracking-tight">
          {value}
        </div>
        {subtext && (
          <div className="text-[11px] text-slate-500 mt-1">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};
