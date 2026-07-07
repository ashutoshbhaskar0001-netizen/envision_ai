import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
  iconColorClass?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  trend = 'neutral', 
  trendText,
  iconColorClass = 'text-blue-500 bg-blue-500/10'
}: StatsCardProps) {
  return (
    <div className="glass-card-interactive flex items-center justify-between">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-100">{value}</span>
          {trendText && (
            <span className={`text-xs font-semibold ${
              trend === 'up' 
                ? 'text-emerald-400' 
                : trend === 'down' 
                  ? 'text-rose-400' 
                  : 'text-slate-400'
            }`}>
              {trendText}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{subtext}</p>
      </div>
      <div className={`p-3.5 rounded-xl ${iconColorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
