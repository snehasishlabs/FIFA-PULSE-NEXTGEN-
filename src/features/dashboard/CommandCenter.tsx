import React, { useState, useCallback, useMemo } from 'react';
import { Stadium, StadiumMetric, Incident, IncidentInput } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { AlertTriangle, Plus, ShieldAlert, Heart, Flame, Users, CheckCircle, Navigation } from 'lucide-react';

interface CommandCenterProps {
  activeStadium: Stadium;
  metrics: StadiumMetric | null;
  incidents: Incident[];
  userRole: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan';
  userName: string;
  reportIncident: (incidentData: IncidentInput) => Promise<boolean>;
  resolveIncident: (id: string) => Promise<boolean>;
}

export default function CommandCenter({
  activeStadium,
  metrics,
  incidents,
  userRole,
  userName,
  reportIncident,
  resolveIncident
}: CommandCenterProps) {
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [newIncTitle, setNewIncTitle] = useState<string>('');
  const [newIncDesc, setNewIncDesc] = useState<string>('');
  const [newIncCat, setNewIncCat] = useState<'crowd' | 'medical' | 'security' | 'facility' | 'weather'>('crowd');
  const [newIncSev, setNewIncSev] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newIncLoc, setNewIncLoc] = useState<string>('');

  const memoizedReportIncident = useCallback(async (incidentData: IncidentInput) => {
    return await reportIncident(incidentData);
  }, [reportIncident]);

  const memoizedResolveIncident = useCallback(async (id: string) => {
    return await resolveIncident(id);
  }, [resolveIncident]);

  if (!activeStadium) {
    return (
      <div role="status" className="flex items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-sky-500 border-slate-700 rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
          <p className="text-slate-400 text-xs font-mono">RETRIEVING STADIUM DETAILS...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div role="status" className="flex items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-sky-500 border-slate-700 rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
          <p className="text-slate-400 text-xs font-mono">RETRIEVING LIVE TELEMETRY...</p>
        </div>
      </div>
    );
  }

  // Calculate attendance percentages
  const attendanceRate = activeStadium.capacity ? ((metrics.attendance / activeStadium.capacity) * 100).toFixed(1) : "0.0";

  // Prepare data for Recharts resource utilization
  const resourceData = useMemo(() => [
    { name: 'Security', value: metrics.resourceUtilization.security },
    { name: 'Medical', value: metrics.resourceUtilization.medical },
    { name: 'Concessions', value: metrics.resourceUtilization.concessions },
    { name: 'Transport', value: metrics.resourceUtilization.transport }
  ], [metrics.resourceUtilization]);

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncTitle || !newIncDesc || !newIncLoc) return;

    const success = await memoizedReportIncident({
      stadiumId: activeStadium.id,
      title: newIncTitle,
      description: newIncDesc,
      category: newIncCat,
      severity: newIncSev,
      location: newIncLoc,
      reporterName: userName
    });

    if (success) {
      setIsReporting(false);
      setNewIncTitle('');
      setNewIncDesc('');
      setNewIncLoc('');
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Main Stats Panel - Column 1 & 2 */}
      <div className="lg:col-span-2 space-y-6">

        {/* Vital KPIs Grid */}
        <section aria-labelledby="kpis-heading" className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <h2 id="kpis-heading" className="sr-only">Key Performance Indicators</h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Live Attendance</span>
            <div className="my-2">
              <span className="text-xl font-bold text-slate-100">{metrics.attendance.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 ml-1">/ {activeStadium.capacity.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden" aria-hidden="true">
              <div className="bg-emerald-500 h-full" style={{ width: `${attendanceRate}%` }}></div>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-1.5">{attendanceRate}% fill rate</span>
          </div>
          
          {/* ... (repeat for other KPI cards) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Crowd Density</span>
            <div className="my-2">
              <span className="text-xl font-bold text-slate-100">{metrics.crowdDensity}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden" aria-hidden="true">
              <div 
                className={`h-full ${metrics.crowdDensity > 85 ? 'bg-rose-500' : metrics.crowdDensity > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${metrics.crowdDensity}%` }}
              ></div>
            </div>
            <span className={`text-[10px] font-mono mt-1.5 ${metrics.crowdDensity > 85 ? 'text-rose-400' : 'text-slate-500'}`}>
              {metrics.crowdDensity > 85 ? 'CRITICAL SAFETY THRESHOLD' : 'OPTIMAL STABILITY'}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Active Incidents</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-100">
                {incidents.filter(i => i.status !== 'resolved').length}
              </span>
              <span className="text-[10px] text-slate-500">unresolved</span>
            </div>
            <div className="flex gap-1" aria-hidden="true">
              <div className="h-1 flex-1 bg-rose-500/20 rounded">
                <div className="h-full bg-rose-500 rounded" style={{ width: incidents.some(i => i.severity === 'critical' && i.status !== 'resolved') ? '100%' : '0%' }}></div>
              </div>
              <div className="h-1 flex-1 bg-amber-500/20 rounded">
                <div className="h-full bg-amber-500 rounded" style={{ width: incidents.some(i => i.severity === 'high' && i.status !== 'resolved') ? '100%' : '0%' }}></div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1.5">Incident severity vector</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Stadium Health Score</span>
            <div className="my-2 flex items-center gap-2">
              <span className={`text-2xl font-bold ${metrics.stadiumHealthScore > 85 ? 'text-emerald-400' : metrics.stadiumHealthScore > 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                {metrics.stadiumHealthScore}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Computed based on density & alert status</div>
            <span className="text-[10px] text-sky-400 font-mono mt-1.5">REAL-TIME TELEMETRY LIVE</span>
          </div>

        </section>

        {/* Gate Congestion Overview */}
        <Card title="Gate Congestion Monitors" subtitle="Active ticket scanning scan-rate queues">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="list">
            {Object.entries(metrics.gateCongestion).map(([gateName, status]) => (
              <div key={gateName} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-col justify-between" role="listitem">
                <span className="text-xs font-semibold text-slate-300 truncate">{gateName}</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    status === 'high' ? 'bg-rose-500 animate-pulse' : status === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} aria-label={status}></div>
                  <span className={`text-[10px] font-mono font-bold ${
                    status === 'high' ? 'text-rose-400' : status === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{status} Queue</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* ... (rest of the file) */}

        {/* Resources Allocation Utilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Card title="Resource Utilization" subtitle="Percentage utility of deployed personnel">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {resourceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.value > 85 ? '#f43f5e' : entry.value > 65 ? '#f59e0b' : '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Quick Security Response Map" subtitle="Critical locations based on active incident feed">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex flex-col justify-between h-[180px]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Tactical Security Channels:</span>
                <span className="text-emerald-400">CH-08 SECURE</span>
              </div>
              
              <div className="space-y-1.5 my-3 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Plaza Command Mobilization:</span>
                  <span className="font-mono text-[11px] text-slate-400">Ready (3 Teams)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>First-Aid Rapid Dispatch:</span>
                  <span className="font-mono text-[11px] text-slate-400">Active (Dispatched Sec 124)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Transit Gate Diversions:</span>
                  <span className="font-mono text-[11px] text-emerald-400">STANDBY SIGNAGE ACTIVE</span>
                </div>
              </div>

              <span className="text-[10px] text-slate-500 font-mono uppercase text-center border-t border-slate-800/80 pt-2">
                Unified Stadium Operations Center Network
              </span>
            </div>
          </Card>

        </div>

      </div>

      {/* Incidents Command Feed - Column 3 */}
      <div className="space-y-6">
        
        <Card 
          title="Incident Command Feed" 
          subtitle="Real-time reported security and safety telemetry"
          actions={
            userRole !== 'fan' && (
              <Button 
                variant="primary" 
                size="xs" 
                onClick={() => setIsReporting(!isReporting)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Log Incident
              </Button>
            )
          }
        >
          {/* Add Incident Form overlay or view */}
          {isReporting && (
            <form onSubmit={handleIncidentSubmit} className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-2 mb-4 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">Log Operational Incident</h4>
              
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Incident Title (e.g., Blocked wheelchair ramp)"
                  value={newIncTitle}
                  onChange={(e) => setNewIncTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded px-2 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                
                <textarea
                  required
                  placeholder="Detailed description..."
                  value={newIncDesc}
                  onChange={(e) => setNewIncDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded px-2 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 h-16 resize-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newIncCat}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewIncCat(e.target.value as 'crowd' | 'medical' | 'security' | 'facility' | 'weather')}
                    className="bg-slate-900 border border-slate-800 text-[11px] rounded px-2 py-1.5 text-slate-300 focus:outline-none"
                  >
                    <option value="crowd">Crowd Incident</option>
                    <option value="medical">Medical Event</option>
                    <option value="security">Security Alert</option>
                    <option value="facility">Facility/ADA Issue</option>
                    <option value="weather">Weather Delay</option>
                  </select>

                  <select
                    value={newIncSev}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewIncSev(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                    className="bg-slate-900 border border-slate-800 text-[11px] rounded px-2 py-1.5 text-slate-300 focus:outline-none"
                  >
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="high">High Severity</option>
                    <option value="critical">Critical Emergency</option>
                  </select>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Specific Location (e.g., Gate A Outer Ramps)"
                  value={newIncLoc}
                  onChange={(e) => setNewIncLoc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded px-2 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/60 mt-2">
                <Button variant="ghost" size="xs" type="button" onClick={() => setIsReporting(false)}>Cancel</Button>
                <Button variant="success" size="xs" type="submit">Submit Report</Button>
              </div>
            </form>
          )}

              {/* Incidents list */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1" aria-live="polite">
            {incidents.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-mono">
                No active incidents reported. All clear.
              </div>
            ) : (
              incidents.map((inc) => (
                <div 
                  key={inc.id} 
                  className={`border p-3 rounded-lg bg-slate-950/80 transition-all ${
                    inc.status === 'resolved' ? 'border-slate-800/40 opacity-60' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[9px] font-mono font-bold uppercase border px-1.5 py-0.5 rounded ${getSeverityBadgeColor(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">
                        {inc.category}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 mb-1 leading-tight">{inc.title}</h4>
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{inc.description}</p>
                  
                  <div className="flex items-center justify-between border-t border-slate-900 pt-2 mt-2 text-[10px] font-mono">
                    <span className="text-slate-400 truncate max-w-[130px]">Loc: {inc.location}</span>
                    
                    {inc.status !== 'resolved' ? (
                      userRole !== 'fan' && userRole !== 'volunteer' ? (
                        <button
                          onClick={() => memoizedResolveIncident(inc.id)}
                          aria-label={`Mark incident ${inc.title} as resolved`}
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Mark Resolved
                        </button>
                      ) : (
                        <span className="text-sky-400 flex items-center gap-1">
                          <Plus className="w-3 h-3 animate-pulse" aria-hidden="true" /> Responding
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

    </div>
  );
}
