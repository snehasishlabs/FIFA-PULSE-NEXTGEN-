import React from 'react';

interface CardProps {
  id?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const Card = React.memo(function Card({ id, title, subtitle, children, className = '', actions }: CardProps) {
  return (
    <div
      id={id}
      className={`bg-slate-900/90 border border-slate-800/80 rounded-lg p-4 shadow-md relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-2.5 mb-3.5">
          <div>
            {title && <h3 className="font-sans font-bold text-slate-100 tracking-tight text-xs uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-slate-500 text-[10px] font-mono mt-0.5 uppercase tracking-widest">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
});

export default Card;
