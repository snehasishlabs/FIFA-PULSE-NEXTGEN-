import React, { memo } from 'react';
import { Stadium, User } from '../types';
import { Activity, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  stadiums: Stadium[];
  activeStadiumId: string;
  setActiveStadiumId: (id: string) => void;
  currentUser: User | null;
  isConnected: boolean;
  highContrast: boolean;
}

function Header({
  stadiums,
  activeStadiumId,
  setActiveStadiumId,
  currentUser,
  isConnected,
  highContrast
}: HeaderProps) {
  return (
    <header className={`border-b ${highContrast ? 'border-white bg-slate-950' : 'border-slate-800 bg-slate-900'} sticky top-0 z-40 transition-colors`}>
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Brand Logo & Connection State */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-600 rounded flex items-center justify-center font-bold text-slate-100 shadow-md">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-slate-100 font-sans font-bold tracking-tight text-sm uppercase">
                FIFA PULSE AI <span className="text-sky-500">NextGen</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-none">Stadium Operations Command Center // v4.0.2</p>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">
                <Wifi className="w-2.5 h-2.5" /> LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 font-semibold px-2 py-0.5 rounded-full font-mono border border-rose-500/20">
                <WifiOff className="w-2.5 h-2.5" /> OFF
              </span>
            )}
          </div>
        </div>

        {/* Filters, Controls & Role Telemetry */}
        <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
          
          {/* Stadium Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="stadium-selector" className="text-slate-400 text-xs font-mono shrink-0 uppercase tracking-wider">Venue:</label>
            <select
              id="stadium-selector"
              value={activeStadiumId}
              onChange={(e) => setActiveStadiumId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
            >
              {stadiums.map((stadium) => (
                <option key={stadium.id} value={stadium.id}>
                  {stadium.name} ({stadium.city})
                </option>
              ))}
            </select>
          </div>

          {/* Connection badge desktop */}
          <div className="hidden md:flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 rounded-full font-mono border border-emerald-500/20">
                <Wifi className="w-3 h-3 animate-pulse" /> Live Realtime Subscribed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 font-semibold px-2.5 py-1 rounded-full font-mono border border-rose-500/20">
                <WifiOff className="w-3 h-3" /> Reconnecting
              </span>
            )}
          </div>

          {/* Current Active Persona tag */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 rounded-md p-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="text-[9px] text-slate-400 font-mono leading-none">ROLE PERSPECTIVE</div>
                <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wide leading-tight">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}

export default memo(Header);
