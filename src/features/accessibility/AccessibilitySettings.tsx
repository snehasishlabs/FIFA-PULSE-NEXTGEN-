import { useState } from 'react';
import { Stadium, AccessibilityService } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Eye, Volume2, HelpCircle, Check, Settings, ShieldCheck } from 'lucide-react';

interface AccessibilitySettingsProps {
  activeStadium: Stadium;
  accessibility: AccessibilityService[];
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  textSize: 'normal' | 'large' | 'extra-large';
  setTextSize: (v: 'normal' | 'large' | 'extra-large') => void;
}

export default function AccessibilitySettings({
  activeStadium,
  accessibility,
  highContrast,
  setHighContrast,
  textSize,
  setTextSize
}: AccessibilitySettingsProps) {
  const [readoutText, setReadoutText] = useState<string>('');
  const [isPlayingText, setIsPlayingText] = useState<boolean>(false);

  // Simulated Screen-Reader synthesizer
  const handleSimulateScreenReader = (text: string) => {
    setReadoutText(text);
    setIsPlayingText(true);
    
    // Simulate audio speaking delay
    setTimeout(() => {
      setIsPlayingText(false);
    }, 4000);
  };

  const getServiceStatusBadge = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'limited': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* WCAG Compliance Options Panel - Column Left */}
      <div className="lg:col-span-5 space-y-6">
        
        <Card title="WCAG Compliance Controls" subtitle="Adjust high contrast, fonts and reading helpers">
          <div className="space-y-5">
            
            {/* Contrast Level Toggle */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Contrast Level:</span>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full py-2.5 px-4 rounded-lg border font-bold flex items-center justify-between transition-all ${
                  highContrast 
                    ? 'bg-white text-slate-950 border-white font-black' 
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                }`}
                aria-pressed={highContrast}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 shrink-0" />
                  High Contrast AA Assist Mode
                </span>
                <span className="text-[10px] uppercase font-mono bg-slate-900 text-white px-2 py-0.5 rounded border border-slate-700">
                  {highContrast ? 'ACTIVE (WHITE-ON-BLACK)' : 'STANDARD'}
                </span>
              </button>
            </div>

            {/* Font Sizing scale */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Scale Typography:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'large', 'extra-large'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTextSize(size)}
                    className={`py-2 rounded-lg border text-xs font-bold uppercase transition-all ${
                      textSize === size
                        ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {size === 'normal' ? '1x Normal' : size === 'large' ? '1.25x Large' : '1.5x Ultra'}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Reader Reader Assist */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Screen Reader Readout HUD</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Click on any of the speaker icon buttons next to accessibility services or stadium metrics to trigger simulated screen-reader audibles.
              </p>

              {readoutText && (
                <div className="bg-slate-900 border border-slate-800 p-3 rounded text-[11px] font-mono text-slate-300 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-1">
                    <span className={`w-2 h-2 rounded-full bg-sky-400 ${isPlayingText ? 'animate-ping' : ''}`}></span>
                    SYNTHESIZING SCREEN READER FEEDBACK:
                  </div>
                  "{readoutText}"
                </div>
              )}
            </div>

            {/* Accessible compliance statement */}
            <div className="flex gap-2.5 items-start text-[10px] text-slate-500 font-mono bg-slate-950/45 p-2 rounded">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Full WCAG 2.1 AA level compliance configured with custom focus rings, keyboard tab states, and screen-reader assistance markers.</span>
            </div>

          </div>
        </Card>

      </div>

      {/* Accessibility Service Statuses - Column Right */}
      <div className="lg:col-span-7 flex flex-col">
        <Card title="Active ADA & Accessibility Services" subtitle="Real-time checkouts of elevator and wheelchair lines">
          
          <div className="space-y-3.5 text-xs">
            {accessibility.length === 0 ? (
              <p className="text-center text-slate-500 py-4 font-mono">No accessibility services listed</p>
            ) : (
              accessibility.map((svc) => {
                const speechString = `${svc.serviceType.replace('_', ' ')} status is currently ${svc.status}. Located at ${svc.locationDetails}.`;
                return (
                  <div key={svc.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-center shrink-0 text-sky-400">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200 font-bold capitalize text-sm">{svc.serviceType.replace('_', ' ')}</span>
                          <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${getServiceStatusBadge(svc.status)}`}>
                            {svc.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1 leading-snug">Loc: {svc.locationDetails}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">Checked: {new Date(svc.lastChecked).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSimulateScreenReader(speechString)}
                      className="p-2 hover:bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 rounded-lg transition-colors flex items-center justify-center"
                      title="Read item out loud"
                      aria-label={`Listen to ${svc.serviceType.replace('_', ' ')} details`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </Card>
      </div>

    </div>
  );
}
