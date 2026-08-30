'use me';
'use client';

import React from 'react';
import {
  CalendarDays,
  Ticket,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StatMetric } from '@/data/mockData';

interface StatCardProps {
  stat: StatMetric;
}

const ICON_MAP: Record<string, React.ElementType> = {
  CalendarDays,
  Ticket,
  TrendingUp,
  DollarSign,
};

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const IconComponent = ICON_MAP[stat.iconName] || TrendingUp;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-300 group space-y-4 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-extrabold text-slate-500 tracking-wider uppercase truncate">
          {stat.title}
        </span>
        <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 group-hover:scale-105 transition-transform shadow-xs shrink-0">
          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 overflow-hidden">
        <h3 className="text-base sm:text-lg lg:text-base xl:text-2xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {stat.value}
        </h3>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div
          className={`flex items-center text-[11px] sm:text-xs font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border shrink-0 ${
            stat.isPositive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {stat.isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
          )}
          <span>{stat.change}</span>
        </div>
        <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">{stat.period}</span>
      </div>
    </div>
  );
};
