import { Shield, User as UserIcon, Users } from 'lucide-react';
import Button from '../../components/Button';
import { User } from '../../types';

interface RoleSelectorProps {
  currentUser: User | null;
  changeRole: (role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan', name: string) => void;
}

export default function RoleSelector({ currentUser, changeRole }: RoleSelectorProps) {
  const roles: { role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan'; name: string; desc: string }[] = [
    { role: 'operations', name: 'Operations Director', desc: 'Full stadium dashboard telemetry, command centre & simulator access.' },
    { role: 'admin', name: 'Security Chief Elena', desc: 'Manage access controls, report incidents, and execute emergency evacuations.' },
    { role: 'venue_staff', name: 'Staff Supervisor Carlos', desc: 'Manage gates, concessions, elevators, and accessibility services.' },
    { role: 'volunteer', name: 'Volunteer PATHFINDER', desc: 'Direct crowd flows, report incidents, and monitor transport queues.' },
    { role: 'fan', name: 'Fan (Ticket Holder)', desc: 'View smart directions, check elevator statuses, find sustainability ratings.' }
  ];

  if (!currentUser) return null;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 shadow-md">
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
        <Users className="w-4 h-4 text-sky-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Perspective Sandbox Selector</h3>
      </div>
      
      <p className="text-[11px] text-slate-400 mb-3 font-mono">
        Toggle roles instantly to simulate Row Level Security (RLS) query restrictions and evaluate custom accessibility views.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        {roles.map((r) => {
          const isSelected = currentUser.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => changeRole(r.role, r.name)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-sky-500/10 border-sky-500 text-sky-300 ring-1 ring-sky-500/30'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {r.role === 'admin' || r.role === 'operations' ? (
                  <Shield className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                ) : (
                  <UserIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                )}
                <span className="text-xs font-bold uppercase tracking-wide truncate">{r.role.replace('_', ' ')}</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-200 truncate">{r.name}</p>
              <p className="text-[9px] text-slate-500 mt-1 line-clamp-2 leading-snug">{r.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
