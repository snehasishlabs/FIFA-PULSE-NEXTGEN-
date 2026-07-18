import React, { useState } from 'react';
import { Stadium, Simulation } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Play, Sparkles, AlertOctagon, RefreshCw, Layers, ShieldAlert } from 'lucide-react';

interface SimulatorProps {
  activeStadium: Stadium;
  simulations: Simulation[];
  userRole: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan';
  runSimulation: (data: { stadiumId: string; scenarioType: Simulation['scenarioType']; intensity: Simulation['intensity'] }) => Promise<boolean>;
}

export default function Simulator({
  activeStadium,
  simulations,
  userRole,
  runSimulation
}: SimulatorProps) {
  const [scenarioType, setScenarioType] = useState<'emergency_evacuation' | 'crowd_surge' | 'weather_disruption' | 'resource_stress_test'>('crowd_surge');
  const [intensity, setIntensity] = useState<'medium' | 'high' | 'extreme'>('high');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Display only the most recent completed simulation's comprehensive breakdown
  const currentSimulation = simulations[0] || null;

  const handleStartSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    try {
      await runSimulation({
        stadiumId: activeStadium?.id || '',
        scenarioType,
        intensity
      });
    } catch (err) {
      console.error("Simulation trigger failed", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const getScenarioLabel = (type: string) => {
    switch (type) {
      case 'emergency_evacuation': return 'Emergency Evacuation Drill';
      case 'crowd_surge': return 'Crowd Surge Stress Test';
      case 'weather_disruption': return 'Severe Weather Sheltering';
      default: return 'Resource Saturation Overload';
    }
  };

  const getIntensityBadge = (lvl: string) => {
    switch (lvl) {
      case 'extreme': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    }
  };

  // Restrict access to administrators and operations managers, demonstrating RLS/role enforcement!
  if (userRole !== 'admin' && userRole !== 'operations') {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center max-w-2xl mx-auto my-4 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-md font-bold text-slate-100 uppercase tracking-wider mb-2">Restricted Access Module</h3>
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          The Match Day Intelligence Simulator performs complex, stress-inducing system drills that adjust stadium metrics.
          Access is limited to **Operations Directors** and **Security Administrators** (Simulated RLS Role Level Security restriction).
        </p>
        <p className="text-xs text-slate-500 font-mono">
          Please use the Sandbox Role Perspective selector at the top to toggle to Admin or Operations.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* Control Setup Panel - Column Left */}
      <div className="lg:col-span-4 flex flex-col">
        <Card title="Simulation Controller" subtitle="Trigger real-time GenAI operations drills">
          
          <div className="space-y-4">
            
            {/* Scenario Type Selection */}
            <div className="space-y-1.5">
              <label htmlFor="scenario-type" className="text-xs text-slate-400 font-mono uppercase tracking-wider">Operational Scenario:</label>
              <select
                id="scenario-type"
                value={scenarioType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScenarioType(e.target.value as Simulation['scenarioType'])}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-md p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              >
                <option value="crowd_surge">Crowd Surge (Transit Arrival Spike)</option>
                <option value="emergency_evacuation">Emergency Evacuation Drill</option>
                <option value="weather_disruption">Severe Weather Sheltering</option>
                <option value="resource_stress_test">Medical/Security Service Overload</option>
              </select>
            </div>

            {/* Stress Intensity Selection */}
            <div className="space-y-1.5">
              <label htmlFor="stress-intensity" className="text-xs text-slate-400 font-mono uppercase tracking-wider">Drill Stress Intensity:</label>
              <div id="stress-intensity" className="grid grid-cols-3 gap-2">
                {(['medium', 'high', 'extreme'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setIntensity(level)}
                    className={`py-2 rounded-md border text-xs font-bold uppercase transition-all ${
                      intensity === level
                        ? level === 'extreme'
                          ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                          : level === 'high'
                            ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                            : 'bg-sky-500/15 border-sky-500 text-sky-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated impact note */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-[11px] text-slate-400 leading-relaxed font-mono">
              <span className="text-amber-400 font-bold block mb-1">⚠️ SYSTEM IMPACT DIRECTIVE:</span>
              Running this simulation calls the Gemini GenAI server to generate live situational updates, adds realistic mock reports into your active Incident Feed, and updates overall Stadium Health Score.
            </div>

            {/* Trigger Button */}
            <Button
              variant="danger"
              id="execute-drill-btn"
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 py-2.5"
              onClick={handleStartSimulation}
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Simulation Scenarios...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Intel Drill</span>
                </>
              )}
            </Button>

          </div>

        </Card>
      </div>

      {/* Main Simulation Output & Findings - Column Right */}
      <div className="lg:col-span-8 flex flex-col">
        <Card 
          title="Drill Operations Intelligence Board" 
          subtitle="Real-time GenAI output of active match day scenario"
          className="flex-1 flex flex-col min-h-[400px]"
        >
          {currentSimulation ? (
            <div className="space-y-5 flex-1 animate-in fade-in slide-in-from-right-3 duration-300 text-xs">
              
              {/* Active scenario info banner */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 text-sm font-bold leading-tight">
                      {getScenarioLabel(currentSimulation.scenarioType)}
                    </h4>
                    <p className="text-slate-500 text-[10px] font-mono mt-0.5 uppercase tracking-wider">
                      STAMP: {new Date(currentSimulation.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${getIntensityBadge(currentSimulation.intensity)}`}>
                    {currentSimulation.intensity} STRESS
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 uppercase font-semibold">
                    ✓ EXECUTION SUCCESS
                  </span>
                </div>
              </div>

              {/* Stress findings */}
              <div className="space-y-2">
                <h5 className="text-[10px] text-sky-400 font-mono uppercase tracking-wider font-bold">GenAI Telemetry & System Findings:</h5>
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl leading-relaxed text-slate-300 font-sans">
                  {currentSimulation.findings}
                </div>
              </div>

              {/* Mitigation procedures */}
              <div className="space-y-2">
                <h5 className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-bold">Proactive Mitigation Directives & Actions:</h5>
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl leading-relaxed text-slate-300 font-sans whitespace-pre-line">
                  {currentSimulation.mitigationPlan}
                </div>
              </div>

              {/* Notification of spawned incidents */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">AI Simulation Side-Effect:</span>
                  <p className="text-[11px] text-slate-300 leading-normal mt-0.5">
                    This stress test successfully logged a high-congestion incident in your primary Feed, dynamically adjusting security and volunteer allocations.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/25 border border-dashed border-slate-800 rounded-xl">
              <Layers className="w-10 h-10 text-slate-700 mb-3" />
              <h4 className="text-sm font-semibold text-slate-400">Drill Log Board Empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                No system stress drills have been triggered for this venue session yet. Set parameters and execute a drill to evaluate how stadium networks process crisis events.
              </p>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
