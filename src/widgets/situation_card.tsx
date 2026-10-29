import React from 'react';
import type { CategoryType } from '../types';

interface SituationCardProps {
  category: CategoryType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  badgeText: string;
  onClick: () => void;
}

export const SituationCard: React.FC<SituationCardProps> = ({
  title,
  subtitle,
  icon,
  gradient,
  badgeText,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl ${gradient} border border-white/10 hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-[0.98] group relative overflow-hidden flex flex-col justify-between min-h-[110px]`}
    >
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-white/90 border border-white/10">
          {badgeText}
        </span>
      </div>

      <div className="mt-3">
        <h3 className="text-lg font-bold text-white tracking-wide group-hover:translate-x-1 transition-transform">
          {title}
        </h3>
        <p className="text-xs text-white/80 font-normal line-clamp-1">
          {subtitle}
        </p>
      </div>
    </button>
  );
};
