import React from 'react';
import {Link} from 'react-router-dom';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center border border-[#E4E4E0] bg-[#F7F7F5]/60 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center border border-[#E4E4E0] bg-white text-[#EA580C]">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl font-bold text-[#111110]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#52524E]">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-sm bg-[#EA580C] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#C2410C] transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-sm bg-[#EA580C] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#C2410C] transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
