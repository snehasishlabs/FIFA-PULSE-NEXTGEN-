import React, { useState } from 'react';
import { Activity, ShieldAlert, Key, Mail, Shield, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

interface LoginProps {
  onLogin: (role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan', name: string) => void | Promise<void>;
  loading?: boolean;
}

export default function Login({ onLogin, loading = false }: LoginProps) {
  let navigate: (path: string) => void;
  try {
    navigate = useNavigate();
  } catch (e) {
    navigate = () => {};
  }
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign up fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan'>('operations');
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate Supabase authentication verification
    setTimeout(async () => {
      setIsSubmitting(false);
      // Map demo accounts based on email prefix or default to operations
      let role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan' = 'operations';
      let name = 'Operations Director';

      const lowerEmail = email.toLowerCase();
      if (lowerEmail.includes('admin') || lowerEmail.includes('security')) {
        role = 'admin';
        name = 'Security Chief Elena';
      } else if (lowerEmail.includes('staff') || lowerEmail.includes('carlos')) {
        role = 'venue_staff';
        name = 'Staff Supervisor Carlos';
      } else if (lowerEmail.includes('volunteer')) {
        role = 'volunteer';
        name = 'Volunteer PATHFINDER';
      } else if (lowerEmail.includes('fan') || lowerEmail.includes('ticket')) {
        role = 'fan';
        name = 'Fan (Ticket Holder)';
      }

      await onLogin(role, name);
      navigate('/dashboard');
    }, 800);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword) {
      setError("Please fill in all fields for signup.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setSignUpSuccessMessage(`Registration successful! Account created for ${signUpName}. You can now log in.`);
      // Autofill login email
      setEmail(signUpEmail);
      // Switch back to login mode so user can log in with new credentials
      setMode('login');
    }, 800);
  };

  const handleQuickAccess = async (role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan', name: string) => {
    await onLogin(role, name);
    navigate('/dashboard');
  };

  const rolesList: { role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan'; name: string; email: string }[] = [
    { role: 'operations', name: 'Operations Director', email: 'ops.director@fifapulse.ai' },
    { role: 'admin', name: 'Security Chief Elena', email: 'security.chief@fifapulse.ai' },
    { role: 'venue_staff', name: 'Staff Supervisor Carlos', email: 'staff.carlos@fifapulse.ai' },
    { role: 'volunteer', name: 'Volunteer PATHFINDER', email: 'volunteer.path@fifapulse.ai' },
    { role: 'fan', name: 'Fan (Ticket Holder)', email: 'fan.worldcup@fifapulse.ai' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center font-sans p-4 select-none relative overflow-hidden">
      
      {/* Background Ambience styling */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 shadow-2xl relative backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-slate-100 shadow-md mx-auto mb-3.5">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-slate-100 font-sans font-extrabold tracking-tight text-lg uppercase">
            FIFA PULSE AI <span className="text-sky-500">Terminal</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
            Global Venue Intelligence Console // WCAG AA Compliant
          </p>
        </div>

        {signUpSuccessMessage && (
          <div id="signup-success-message" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg p-3 mb-4">
            {signUpSuccessMessage}
          </div>
        )}

        {error && (
          <div data-testid="login-error" className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 mb-4 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            type="button"
            id="login-tab"
            onClick={() => { setMode('login'); setSignUpSuccessMessage(null); setError(null); }}
            className={`flex-1 pb-2.5 text-xs font-mono uppercase tracking-wider text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Authenticate (Login)
          </button>
          <button
            type="button"
            id="signup-tab"
            onClick={() => { setMode('signup'); setSignUpSuccessMessage(null); setError(null); }}
            className={`flex-1 pb-2.5 text-xs font-mono uppercase tracking-wider text-center border-b-2 transition-all ${
              mode === 'signup'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register (Sign Up)
          </button>
        </div>

        {/* Conditional Form Rendering */}
        {mode === 'login' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="login-email">
                OPERATIONAL EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="operator@fifapulse.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="login-password">
                OPERATIONS PASSPHRASE
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 font-semibold"
                />
              </div>
            </div>

            <Button
              type="submit"
              id="login-submit"
              variant="primary"
              className="w-full justify-center py-2 text-xs font-bold uppercase tracking-wider mt-2"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'Verifying Credentials...' : 'Authenticate & Enter'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="signup-name">
                FULL NAME
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Elena Rostova"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="signup-email">
                OPERATIONAL EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="elena.rostova@fifapulse.ai"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="signup-password">
                CREATE PASSPHRASE
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••••••••"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="signup-role">
                ASSIGNED TACTICAL ROLE
              </label>
              <select
                id="signup-role"
                value={signUpRole}
                onChange={(e) => setSignUpRole(e.target.value as 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-lg py-2 px-3 text-xs text-slate-200 font-semibold"
              >
                <option value="operations">Operations Director</option>
                <option value="admin">Security Chief</option>
                <option value="venue_staff">Staff Supervisor</option>
                <option value="volunteer">Volunteer PATHFINDER</option>
                <option value="fan">Fan (Ticket Holder)</option>
              </select>
            </div>

            <Button
              type="submit"
              id="signup-submit"
              variant="primary"
              className="w-full justify-center py-2 text-xs font-bold uppercase tracking-wider mt-2"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'Registering...' : 'Register New Account'}
            </Button>
          </form>
        )}

        {/* Quick Demo Gateways */}
        <div className="mt-6 border-t border-slate-800/80 pt-5">
          <h2 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3 text-center">
            TACTICAL ROLES QUICK PORTAL
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {rolesList.map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => handleQuickAccess(r.role, r.name)}
                className="flex flex-col items-start p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {r.role === 'admin' || r.role === 'operations' ? (
                    <Shield className="w-3 h-3 text-sky-400" />
                  ) : (
                    <UserIcon className="w-3 h-3 text-slate-400 group-hover:text-sky-400 transition-colors" />
                  )}
                  <span className="text-[9px] font-black uppercase text-slate-300 group-hover:text-slate-100 transition-colors">
                    {r.role.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[8px] font-medium text-slate-500 truncate w-full">{r.name}</p>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Safety Notice Footer */}
      <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-6 text-center">
        RESTRICTED ACCESS // SUBJECT TO REAL-TIME REMOTE INCIDENT AUDITING
      </p>

    </div>
  );
}
