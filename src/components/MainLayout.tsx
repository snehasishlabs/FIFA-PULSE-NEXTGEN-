import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import Header from './Header';
import RoleSelector from '../features/auth/RoleSelector';
import { 
  LayoutDashboard, 
  Brain, 
  Play, 
  Navigation, 
  Settings, 
  Bell, 
  Map, 
  LogOut,
  AlertTriangle,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function MainLayout() {
  const {
    stadiums,
    activeStadiumId,
    setActiveStadiumId,
    currentUser,
    isConnected,
    highContrast,
    textSize,
    notifications,
    changeRole
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getTextSizeClass = () => {
    if (textSize === 'extra-large') return 'text-lg';
    if (textSize === 'large') return 'text-md';
    return 'text-sm';
  };

  const handleLogout = () => {
    // Clear user and redirect to login
    changeRole('fan', 'Fan (Ticket Holder)');
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { path: '/intelligence', label: 'Venue Intelligence', icon: Map },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Brain },
    { path: '/simulator', label: 'Match Simulator', icon: Play },
    { path: '/logistics', label: 'Logistics & Maps', icon: Navigation },
    { path: '/accessibility', label: 'ADA Assist', icon: Settings },
    { path: '/notifications', label: 'Alarm Hub', icon: Bell, badgeCount: notifications.filter(n => !n.isRead).length },
  ];

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300 ${
      highContrast ? 'bg-black text-white border-white high-contrast' : ''
    } ${getTextSizeClass()}`}>
      
      {/* Header */}
      <Header
        stadiums={stadiums}
        activeStadiumId={activeStadiumId}
        setActiveStadiumId={setActiveStadiumId}
        currentUser={currentUser}
        isConnected={isConnected}
        highContrast={highContrast}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 gap-6">
        
        {/* Responsive Mobile Menu Button */}
        <div className="md:hidden flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">CONSOLE NAVIGATION</span>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-1 text-slate-400 hover:text-slate-100 focus:outline-none"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar/Navigation - Desktop */}
        <nav className={`w-full md:w-60 shrink-0 space-y-2 ${
          mobileMenuOpen ? 'block' : 'hidden md:block'
        }`}>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 space-y-1 shadow-lg">
            <span className="hidden md:block text-[9px] font-mono text-slate-500 uppercase tracking-widest px-3 mb-2">Tactical Terminal Nodes</span>
            
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
              const IconComp = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    isActive
                      ? 'bg-sky-600 text-slate-100 shadow-md shadow-sky-950/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  aria-selected={isActive}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="bg-rose-500 text-slate-100 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-900 animate-pulse">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            {/* Logout Option */}
            <div className="pt-2 mt-2 border-t border-slate-800/80">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-all text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Secure Sign Out</span>
              </button>
            </div>
          </div>


        </nav>

        {/* Content Workspace */}
        <main className="flex-1 min-w-0 space-y-6">
          <Outlet />
          
          {/* Sandbox Role Switcher Footer (extremely valuable for QA testing and checking full application visual response) */}
          <div className="pt-6 border-t border-slate-900">
            <RoleSelector 
              currentUser={currentUser} 
              changeRole={changeRole} 
            />
          </div>
        </main>

      </div>

      {/* Persistent Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-[10px] font-mono text-slate-500 tracking-wider">
        FIFA WORLD CUP 2026 UNIFIED STADIUM MANAGEMENT SYSTEMS • SECURE NODE CHANNEL
      </footer>

    </div>
  );
}
