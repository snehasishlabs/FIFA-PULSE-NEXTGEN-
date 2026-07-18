import React, { useState, useMemo } from 'react';
import { useApp } from '../../app/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { 
  Plus, 
  MapPin, 
  Users, 
  Activity, 
  AlertTriangle, 
  Flame, 
  Heart, 
  Zap, 
  Layers, 
  Navigation,
  FileSpreadsheet,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function StadiumIntelligencePage() {
  const {
    activeStadium,
    metrics,
    incidents,
    currentUser,
    reportIncident,
    resolveIncident
  } = useApp();

  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [newIncTitle, setNewIncTitle] = useState<string>('');
  const [newIncDesc, setNewIncDesc] = useState<string>('');
  const [newIncCat, setNewIncCat] = useState<'crowd' | 'medical' | 'security' | 'facility' | 'weather'>('crowd');
  const [newIncSev, setNewIncSev] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newIncLoc, setNewIncLoc] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  if (!activeStadium) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-sky-500 border-slate-700 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-xs font-mono">LOADING VENUE PROFILE...</p>
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

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncTitle || !newIncDesc || !newIncLoc) return;

    const success = await reportIncident({
      stadiumId: activeStadium.id,
      title: newIncTitle,
      description: newIncDesc,
      category: newIncCat,
      severity: newIncSev,
      location: newIncLoc,
      reporterName: currentUser?.name || 'Staff Terminal'
    });

    if (success) {
      setIsReporting(false);
      setNewIncTitle('');
      setNewIncDesc('');
      setNewIncLoc('');
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      const catMatch = categoryFilter === 'all' || i.category === categoryFilter;
      const sevMatch = severityFilter === 'all' || i.severity === severityFilter;
      return catMatch && sevMatch;
    });
  }, [incidents, categoryFilter, severityFilter]);

  const canManageIncidents = currentUser?.role === 'admin' || currentUser?.role === 'operations';

  return (
    <div className="space-y-6">
      
      {/* Stadium Physical Profile Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent)] pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[10px] uppercase tracking-wider font-bold mb-1">
              <MapPin className="w-3.5 h-3.5" /> FIFA VENUE PROFILE
            </div>
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">{activeStadium.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{activeStadium.city.toUpperCase()} // LAT: {activeStadium.latitude} LNG: {activeStadium.longitude}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Total SEAT capacity</span>
                <span className="text-lg font-black font-mono text-slate-100">{activeStadium.capacity.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Live Attendance Rate</span>
                <span className="text-lg font-black font-mono text-sky-400">
                  {((activeMetrics.attendance / activeStadium.capacity) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Live On-Duty Staff</span>
                <span className="text-lg font-black font-mono text-emerald-400">1,240</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stadium Health Analysis Card */}
        <Card title="Structural Integrity Index" subtitle="Real-time sensory diagnostics">
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Sensors Health</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">99.8% ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Power Grid (Main & UPS)</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">STABLE // active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">HVAC Air Filtration</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">NOMINAL</span>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-slate-300">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-sky-500" /> Sensor telemetry
              </span>
              <span className="text-xs font-black font-mono">{activeMetrics.stadiumHealthScore}% Rating</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Bento Grid layout with extra venue analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <Card title="CROWD FLOW STATUS" subtitle="Turnstile flow telemetry" className="md:col-span-2">
          <div className="space-y-2 mt-1">
            {Object.entries(activeMetrics.gateCongestion).map(([gateName, congestion]) => (
              <div key={gateName} className="flex items-center justify-between p-2 bg-slate-950/30 border border-slate-800/40 rounded">
                <span className="text-xs font-bold text-slate-300 uppercase font-mono">{gateName}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    congestion === 'high' ? 'bg-rose-500 animate-ping' : congestion === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{congestion} throughput</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Tactical Deployments" subtitle="Staffing allocations">
          <div className="space-y-3.5 mt-1">
            <div>
              <div className="flex justify-between text-[11px] font-mono uppercase text-slate-400 mb-1">
                <span>Security Details</span>
                <span>{activeMetrics.resourceUtilization.security}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${activeMetrics.resourceUtilization.security}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono uppercase text-slate-400 mb-1">
                <span>Medical Officers</span>
                <span>{activeMetrics.resourceUtilization.medical}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${activeMetrics.resourceUtilization.medical}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono uppercase text-slate-400 mb-1">
                <span>Concessions Hubs</span>
                <span>{activeMetrics.resourceUtilization.concessions}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${activeMetrics.resourceUtilization.concessions}%` }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Emergency Evacuation" subtitle="Egress readiness indicators">
          <div className="space-y-2 mt-1">
            <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase">Egress gates unblocked</span>
            </div>
            <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase">PA System Fully operational</span>
            </div>
            <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase">Dynamic safety signs online</span>
            </div>
          </div>
        </Card>

      </div>

      {/* Incident Management Section */}
      <Card 
        title="Live Incident Ledger" 
        subtitle="Operational reports requiring monitoring or signoff"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono rounded px-2 py-1 focus:outline-none"
            >
              <option value="all">ALL CATEGORIES</option>
              <option value="crowd">CROWD</option>
              <option value="medical">MEDICAL</option>
              <option value="security">SECURITY</option>
              <option value="facility">FACILITY</option>
              <option value="weather">WEATHER</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono rounded px-2 py-1 focus:outline-none"
            >
              <option value="all">ALL SEVERITIES</option>
              <option value="critical">CRITICAL</option>
              <option value="high">HIGH</option>
              <option value="medium">MEDIUM</option>
              <option value="low">LOW</option>
            </select>
            {currentUser?.role !== 'fan' && (
              <Button 
                variant="primary" 
                size="xs" 
                onClick={() => setIsReporting(!isReporting)}
                className="gap-1 font-bold"
              >
                <Plus className="w-3 h-3" /> Report Incident
              </Button>
            )}
          </div>
        }
      >
        {/* Incident Reporting Form */}
        {isReporting && (
          <form onSubmit={handleIncidentSubmit} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> New Operations Report Ticket
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">INCIDENT TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Blocked turnstile gate 4"
                  value={newIncTitle}
                  onChange={(e) => setNewIncTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">LOCATION / CONCOURSE</label>
                <input
                  type="text"
                  placeholder="e.g. Gate 4 entrance ramp"
                  value={newIncLoc}
                  onChange={(e) => setNewIncLoc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">CATEGORY</label>
                <select
                  value={newIncCat}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewIncCat(e.target.value as 'crowd' | 'medical' | 'security' | 'facility' | 'weather')}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none font-semibold"
                >
                  <option value="crowd">Crowd Flow Management</option>
                  <option value="medical">Medical / First Aid Request</option>
                  <option value="security">Security & Access Violation</option>
                  <option value="facility">Facility & Power Issue</option>
                  <option value="weather">Weather Disruption</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">SEVERITY LEVEL</label>
                <select
                  value={newIncSev}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewIncSev(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none font-semibold"
                >
                  <option value="low">Low (Standard Info)</option>
                  <option value="medium">Medium (Requires Staff Action)</option>
                  <option value="high">High (Requires Command Dispatch)</option>
                  <option value="critical">Critical (Immediate Evacuation / Lockdown)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">PROBLEM DESCRIPTION</label>
              <textarea
                placeholder="Detail observations, estimate affected fan volume, and list action items..."
                value={newIncDesc}
                onChange={(e) => setNewIncDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-3 py-2 h-20 focus:outline-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsReporting(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Submit Report Ticket
              </Button>
            </div>
          </form>
        )}

        {/* Incidents Table / Ledger */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="py-2.5 px-3">severity</th>
                <th className="py-2.5 px-3">details</th>
                <th className="py-2.5 px-3">location</th>
                <th className="py-2.5 px-3">category</th>
                <th className="py-2.5 px-3">reported by</th>
                <th className="py-2.5 px-3 text-right">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredIncidents.map((inc) => {
                const isResolved = inc.status === 'resolved';
                const severityClass = 
                  inc.severity === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 font-black' :
                  inc.severity === 'high' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                  'text-sky-400 bg-sky-500/10 border-sky-500/20';

                return (
                  <tr key={inc.id} className={`hover:bg-slate-900/30 transition-colors ${isResolved ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-3">
                      <span className={`text-[9px] uppercase px-2 py-0.5 rounded border font-mono ${severityClass}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-xs font-bold text-slate-200 uppercase">{inc.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 max-w-sm line-clamp-1">{inc.description}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-300 font-mono block">{inc.location}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] uppercase font-mono text-slate-400">{inc.category}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-300 font-medium block">{inc.reporterName}</span>
                      <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                        {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!isResolved ? (
                        canManageIncidents ? (
                          <Button 
                            variant="success" 
                            size="xs" 
                            onClick={() => resolveIncident(inc.id)}
                            className="font-bold"
                          >
                            Resolve
                          </Button>
                        ) : (
                          <span className="text-[10px] font-mono uppercase text-amber-500 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ACTIVE
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> RESOLVED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500 uppercase font-mono tracking-widest">
                    No active incident tickets recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
