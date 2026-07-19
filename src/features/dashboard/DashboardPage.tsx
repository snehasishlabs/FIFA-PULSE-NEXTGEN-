import { useState, useMemo } from 'react';
import { useApp } from '../../app/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { 
  Heart, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Zap,
  TrendingUp,
  Signal,
  X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    activeStadium,
    metrics,
    incidents,
    notifications,
    currentUser
  } = useApp();

  const [activeGateFilter, setActiveGateFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isAlertBarClosed, setIsAlertBarClosed] = useState<boolean>(false);

  if (!activeStadium) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-sky-500 border-slate-700 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-xs font-mono">LOADING VENUE SYSTEM...</p>
        </div>
      </div>
    );
  }

  const activeMetrics = metrics[activeStadium.id] || {
    attendance: 0,
    crowdDensity: 0,
    stadiumHealthScore: 100,
    gateCongestion: { 'Gate A': 'low', 'Gate B': 'low', 'Gate C': 'low', 'Gate D': 'low' },
    resourceUtilization: { security: 50, medical: 40, concessions: 45, transport: 50 }
  };

  const attendanceRate = activeStadium.capacity 
    ? ((activeMetrics.attendance / activeStadium.capacity) * 100).toFixed(1) 
    : "0.0";

  // Critical Incidents Count
  const criticalIncidentsCount = incidents.filter(i => i.status !== 'resolved' && (i.severity === 'critical' || i.severity === 'high')).length;

  // Active incidents summary
  const unresolvedIncidents = useMemo(() => {
    return incidents.filter(i => i.status !== 'resolved');
  }, [incidents]);

  // Operational recommendations count
  const warningsCount = notifications.filter(n => !n.isRead && n.type === 'ai_warning').length;

  // Gate breakdown
  const gates = useMemo(() => {
    return Object.entries(activeMetrics.gateCongestion).map(([gateName, status]) => ({
      name: gateName,
      status
    }));
  }, [activeMetrics.gateCongestion]);

  const filteredGates = useMemo(() => {
    return gates.filter(g => activeGateFilter === 'all' || g.status === activeGateFilter);
  }, [gates, activeGateFilter]);

  const resourceData = useMemo(() => {
    return [
      { name: 'Security', value: activeMetrics.resourceUtilization.security },
      { name: 'Medical', value: activeMetrics.resourceUtilization.medical },
      { name: 'Concessions', value: activeMetrics.resourceUtilization.concessions },
      { name: 'Transport', value: activeMetrics.resourceUtilization.transport }
    ];
  }, [activeMetrics.resourceUtilization]);

  return (
    <div className="space-y-6">
      
      {/* Upper Alerts Ribbon */}
      {criticalIncidentsCount > 0 && !isAlertBarClosed && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-3 text-xs flex items-center justify-between" id="critical-alert-bar">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wider">CRITICAL ALERT:</span>
            <span>{criticalIncidentsCount} High-Severity Incidents currently require immediate tactical intervention.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="xs" 
              className="text-rose-400 hover:text-rose-200"
              onClick={() => navigate('/notifications')}
            >
              Review Alarms <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            <button
              onClick={() => setIsAlertBarClosed(true)}
              className="p-1 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-200 rounded transition-colors"
              aria-label="Dismiss Alert Banner"
              title="Dismiss warning bar"
              id="close-alert-bar-btn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome Bannerey */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950/40 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-mono text-[10px] uppercase tracking-widest font-semibold mb-1">
            <Signal className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> Live Telemetry Synced
          </div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight italic no-underline">
            Welcome Back, {currentUser?.name || 'Operations Officer'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
            You are viewing the Command console for <strong className="text-slate-200">{activeStadium.name}</strong>. Real-time subscriptions are active with 100ms latency.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate('/intelligence')}
            className="text-[11px] font-bold uppercase tracking-wider"
          >
            Tactical Analysis
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => navigate('/ai-assistant')}
            className="text-[11px] font-bold uppercase tracking-wider gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Copilot
          </Button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Stat Card 1: Stadium Health Score */}
        <Card title="Stadium Health Index" subtitle="Overall Integrity Rating">
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="text-3xl font-black font-mono text-slate-100 flex items-center gap-1.5 leading-none">
                {activeMetrics.stadiumHealthScore}%
                <Heart className={`w-5 h-5 ${activeMetrics.stadiumHealthScore >= 80 ? 'text-emerald-500' : activeMetrics.stadiumHealthScore >= 50 ? 'text-amber-500' : 'text-rose-500 animate-pulse'}`} />
              </div>
              <p className="text-[9px] text-slate-500 font-mono uppercase mt-2 tracking-wider">
                {activeMetrics.stadiumHealthScore >= 80 ? 'SYSTEM INTEGRITY SAFE' : activeMetrics.stadiumHealthScore >= 50 ? 'WARNING: DEGRADED STATUS' : 'CRITICAL FAULT LIMIT'}
              </p>
            </div>
            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  activeMetrics.stadiumHealthScore >= 80 ? 'bg-emerald-500' : activeMetrics.stadiumHealthScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${activeMetrics.stadiumHealthScore}%` }}
              ></div>
            </div>
          </div>
        </Card>

        {/* Stat Card 2: Attendance */}
        <Card title="Crowd Attendance" subtitle={`${attendanceRate}% Capacity Occupied`}>
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="text-3xl font-black font-mono text-slate-100 leading-none">
                {activeMetrics.attendance.toLocaleString()}
              </div>
              <p className="text-[9px] text-slate-500 font-mono uppercase mt-2 tracking-wider">
                Max Limit: {activeStadium.capacity.toLocaleString()}
              </p>
            </div>
            <Users className="w-6 h-6 text-sky-400" />
          </div>
        </Card>

        {/* Stat Card 3: Crowd Density */}
        <Card title="Crowd Density" subtitle="Live Hotspot Monitoring">
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="text-3xl font-black font-mono text-slate-100 leading-none">
                {activeMetrics.crowdDensity}%
              </div>
              <p className="text-[9px] text-slate-500 font-mono uppercase mt-2 tracking-wider">
                Status: {activeMetrics.crowdDensity > 80 ? 'DENSE CROWDING' : activeMetrics.crowdDensity > 50 ? 'MODERATE' : 'NORMAL'}
              </p>
            </div>
            <Zap className={`w-5 h-5 ${activeMetrics.crowdDensity > 80 ? 'text-rose-500 animate-bounce' : 'text-sky-400'}`} />
          </div>
        </Card>

        {/* Stat Card 4: Incident Logged */}
        <Card title="Live Incident Queue" subtitle="Active Operations Tickets">
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="text-3xl font-black font-mono text-slate-100 leading-none">
                {unresolvedIncidents.length}
              </div>
              <p className="text-[9px] text-slate-500 font-mono uppercase mt-2 tracking-wider">
                {criticalIncidentsCount} require supervisor review
              </p>
            </div>
            <ShieldCheck className={`w-6 h-6 ${unresolvedIncidents.length === 0 ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
          </div>
        </Card>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Resource Allocation & Recharts */}
        <div className="lg:col-span-7">
          <Card 
            title="Operational Resource Stress" 
            subtitle="Current staffing & logistics deployment ratios"
            actions={
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-sky-500" /> Live Stress Factor
              </div>
            }
          >
            <div className="h-[200px] w-full mt-2 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#f1f5f9', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} data-testid="resource-bar">
                    {resourceData.map((entry, index) => {
                      const color = entry.value > 85 ? '#f43f5e' : entry.value > 65 ? '#f59e0b' : '#0284c7';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4 text-center">
              {resourceData.map((entry) => (
                <div key={entry.name} className="p-2 bg-slate-950/40 rounded border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">{entry.name}</span>
                  <span className={`text-xs font-black font-mono ${entry.value > 85 ? 'text-rose-400' : entry.value > 65 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Gate Congestion Overview */}
        <div className="lg:col-span-5">
          <Card 
            title="Gate Access Telemetry" 
            subtitle="Concourse & turnstile throughput rates"
            actions={
              <div className="flex gap-1.5">
                {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveGateFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                      activeGateFilter === filter
                        ? 'bg-sky-600 text-slate-100'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            }
          >
            <div className="space-y-2 mt-2">
              {filteredGates.map((gate) => {
                const statusColor = 
                  gate.status === 'high' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                  gate.status === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
                  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                return (
                  <div key={gate.name} className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        gate.status === 'high' ? 'bg-rose-500' : gate.status === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                      <span className="text-xs font-bold text-slate-300 uppercase font-mono">{gate.name}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                      {gate.status} Flow
                    </span>
                  </div>
                );
              })}
              {filteredGates.length === 0 && (
                <p className="text-center text-[11px] text-slate-500 py-6 font-mono uppercase">
                  No gates match filter criteria
                </p>
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
