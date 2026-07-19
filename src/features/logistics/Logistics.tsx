import React, { useState, useRef, useEffect } from 'react';
import { Stadium, TransportUpdate, NavigationStep, NavigationAlternative, NavigationRoutePlan, ChatMessage } from '../../types';
import Card from '../../components/Card';
import GoogleMapComponent from '../../components/GoogleMapComponent';
import { 
  Bus, 
  Leaf, 
  Clock, 
  MapPin, 
  Navigation, 
  Sparkles, 
  Accessibility, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight, 
  Languages, 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  RotateCcw,
  Users,
  Locate
} from 'lucide-react';

interface LogisticsProps {
  activeStadium: Stadium;
  transport: TransportUpdate[];
}

export default function Logistics({ activeStadium, transport }: LogisticsProps) {
  // Routing form states
  const [origin, setOrigin] = useState<string>('transit_station');
  const [destination, setDestination] = useState<string>('gate_a');
  const [routeType, setRouteType] = useState<'standard' | 'crowd_avoidance' | 'accessible' | 'family' | 'evacuation'>('standard');
  const [language, setLanguage] = useState<'en' | 'es' | 'pt' | 'fr'>('en');

  // Route calculation states
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routePlan, setRoutePlan] = useState<NavigationRoutePlan | null>(null);

  // Chat advisor states
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your FIFA Pulse Live Route Advisor. I analyze live crowd metrics, active safety incidents, elevator statuses, and transport line queues to help you navigate this stadium efficiently. Ask me anything!",
      timestamp: new Date()
    }
  ]);
  const [sendingChat, setSendingChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (typeof chatBottomRef.current?.scrollIntoView === 'function') {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleCalculateRoute = async () => {
    try {
      setLoadingRoute(true);
      setRouteError(null);

      const res = await fetch('/api/navigation/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stadiumId: activeStadium.id,
          origin,
          destination,
          routeType,
          language
        })
      });

      if (!res.ok) {
        throw new Error("Failed to calculate navigation trajectory from core API.");
      }

      const responseData = await res.json();
      if (responseData.status === 'success' && responseData.data) {
        setRoutePlan(responseData.data);
      } else {
        throw new Error(responseData.error || "Calculated route payload returned empty.");
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Unable to query navigation service.";
      setRouteError(errMsg);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleSendChatMessage = async (msgText?: string) => {
    const textToSend = msgText || chatMessage;
    if (!textToSend.trim()) return;

    // Add user message to history
    const userMsg: ChatMessage = { sender: 'user', text: textToSend, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    if (!msgText) setChatMessage('');

    try {
      setSendingChat(true);

      const res = await fetch('/api/navigation/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stadiumId: activeStadium.id,
          message: textToSend,
          language
        })
      });

      if (!res.ok) {
        throw new Error("Advisor system is momentarily offline.");
      }

      const responseData = await res.json();
      if (responseData.status === 'success' && responseData.data?.advice) {
        setChatHistory(prev => [...prev, {
          sender: 'assistant',
          text: responseData.data.advice,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(responseData.error || "Advisor returned empty response.");
      }
    } catch (err: unknown) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        sender: 'assistant',
        text: `My communication channel was interrupted. Telemetry review: Current stadium crowd density is active. I highly suggest bypass routing to Gates B or C for direct entry and fast-lane pedestrian corridors.`,
        timestamp: new Date()
      }]);
    } finally {
      setSendingChat(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'smooth': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'congested': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'delayed': return 'text-amber-500 bg-amber-500/15 border-amber-500/25';
      default: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  const getSustainabilityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getRouteTypeLabel = (type: string) => {
    switch (type) {
      case 'standard': return '⚡ Standard Route';
      case 'crowd_avoidance': return '🔥 AI Crowd Avoidance';
      case 'accessible': return '♿ Wheelchair Accessible';
      case 'family': return '👶 Family Friendly';
      case 'evacuation': return '🚨 Emergency Escape';
      default: return 'Navigation Route';
    }
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'en': return 'English';
      case 'es': return 'Español';
      case 'pt': return 'Português';
      case 'fr': return 'Français';
      default: return code;
    }
  };

  if (!activeStadium) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-sky-500 border-slate-700 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-xs font-mono">RETRIEVING STADIUM DETAILS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* Map, Guidance Controls, & Routing Output - Column Left */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Map Layer Card */}
        <Card 
          title={`Interactive Logistics Hub - ${activeStadium.name}`}
          subtitle="Real-time pedestrian trajectories, stadium gate queues, and accessible pathways. Current focus area: FIFA FIELD (SECURE ZONE)"
          className="relative"
        >
          <div className="mb-4">
            <GoogleMapComponent 
              lat={activeStadium.latitude} 
              lng={activeStadium.longitude} 
              stadiumId={activeStadium.id}
              pathCoordinates={routePlan?.pathCoordinates}
              routeType={routeType}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
              <span className="text-blue-400 font-bold block mb-0.5">● ENTRY GATES</span>
              <span className="text-slate-400">Blue Pins</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
              <span className="text-emerald-400 font-bold block mb-0.5">● ACCESSIBLE ACCESS</span>
              <span className="text-slate-400">Green Pins</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
              <span className="text-amber-400 font-bold block mb-0.5">● TRANSIT STATIONS</span>
              <span className="text-slate-400">Amber Pins</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
              <span className="text-sky-400 font-bold block mb-0.5">⚡ ACTIVE PATH</span>
              <span className="text-slate-400">Dynamic Polyline</span>
            </div>
          </div>
        </Card>

        {/* AI Route Configuration Guidance Cockpit */}
        <Card 
          title="FIFA Smart Route Guidance Panel" 
          subtitle="Generate high-precision trajectories customized for crowd density, mobility, and language"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Origin Option */}
            <div className="space-y-1.5">
              <label htmlFor="route-origin" className="text-xs font-mono uppercase tracking-widest text-slate-400 block flex items-center gap-1.5">
                <Locate className="w-3.5 h-3.5 text-sky-400" /> Origin Point:
              </label>
              <select
                id="route-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-sky-500"
              >
                <option value="transit_station">🚉 Rail Transit Hub</option>
                <option value="parking_lot_c">🚗 Parking Lot C (ADA)</option>
                <option value="parking_lot_g">🚙 General Parking Lot G</option>
              </select>
            </div>

            {/* Destination Gate Option */}
            <div className="space-y-1.5">
              <label htmlFor="route-destination" className="text-xs font-mono uppercase tracking-widest text-slate-400 block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Destination Gate:
              </label>
              <select
                id="route-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-sky-500"
              >
                <option value="gate_a">Gate A (North Entrance)</option>
                <option value="gate_b">Gate B (East Entrance)</option>
                <option value="gate_c">Gate C (ADA Main Entrance)</option>
              </select>
            </div>

            {/* Routing Mode Choice */}
            <div className="space-y-1.5">
              <label htmlFor="route-mode" className="text-xs font-mono uppercase tracking-widest text-slate-400 block flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" /> Routing Mode:
              </label>
              <select
                id="route-mode"
                value={routeType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRouteType(e.target.value as 'standard' | 'crowd_avoidance' | 'accessible' | 'family' | 'evacuation')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-sky-500"
              >
                <option value="standard">⚡ Standard Pathway</option>
                <option value="crowd_avoidance">🔥 AI Crowd Avoidance</option>
                <option value="accessible">♿ Wheelchair Friendly</option>
                <option value="family">👶 Family & Strollers</option>
                <option value="evacuation">🚨 Evacuation Corridor</option>
              </select>
            </div>

            {/* Language Translation */}
            <div className="space-y-1.5">
              <label htmlFor="route-language" className="text-xs font-mono uppercase tracking-widest text-slate-400 block flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-sky-400" /> System Language:
              </label>
              <select
                id="route-language"
                value={language}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value as 'en' | 'es' | 'pt' | 'fr')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-sky-500"
              >
                <option value="en">English (US)</option>
                <option value="es">Español (ES)</option>
                <option value="pt">Português (BR)</option>
                <option value="fr">Français (FR)</option>
              </select>
            </div>

          </div>

          <div className="mt-5 flex flex-col gap-2">
            {routeError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-mono">
                {routeError}
              </div>
            )}
            <button
              onClick={handleCalculateRoute}
              disabled={loadingRoute}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-slate-100 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loadingRoute ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-white border-slate-700 rounded-full animate-spin"></div>
                  COMPUTING OPTIMAL PATHWAY...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  CALCULATE AI ROUTE DIRECTIVES
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Calculated Trajectory Route Output Card */}
        {routePlan && (
          <Card 
            title={getRouteTypeLabel(routeType)} 
            subtitle="Custom spatial layout computed using World Cup real-time telemetry filters"
            className="border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.03)] animate-in fade-in slide-in-from-bottom-2"
          >
            {/* Route Stats Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Total Distance</span>
                <span className="text-lg font-bold text-slate-200 font-mono mt-0.5 block">{routePlan.totalDistanceMeters}m</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Est. Travel Time</span>
                <span className="text-lg font-bold text-slate-200 font-mono mt-0.5 block">{routePlan.estimatedDurationMinutes} mins</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Crowd Density</span>
                <span className={`inline-block mt-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  routePlan.routeDensityLevel === 'low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  routePlan.routeDensityLevel === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                }`}>
                  {routePlan.routeDensityLevel} density
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">ADA Safety Rating</span>
                <span className={`inline-block mt-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  routePlan.accessibilityRating === 'optimal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  routePlan.accessibilityRating === 'limited' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {routePlan.accessibilityRating.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Warnings Alert Callout */}
            {routePlan.warnings && routePlan.warnings.length > 0 && (
              <div className="mt-4 bg-rose-500/10 border border-rose-500/15 p-3 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide">Live Pathway Incident/Delay Warning</h4>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 leading-relaxed">
                    {routePlan.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Route AI Explanation Commentary */}
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-850 relative">
              <div className="absolute top-3 right-3 text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                AI Commentary ({getLanguageName(language)})
              </div>
              <h4 className="text-xs font-bold text-slate-400 mb-2 font-mono uppercase tracking-wider">Spatial Reasoning</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{routePlan.routeExplanation}</p>
            </div>

            {/* Turn by Turn Directions */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider block">Turn-by-Turn Path Instructions</h4>
              <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-5">
                {routePlan.steps.map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Visual node bullet */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-500 group-hover:scale-110 transition-transform flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{step.instruction}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-500">
                        <span>Distance: {step.distanceMeters}m</span>
                        <span>•</span>
                        <span>Walk Time: {Math.ceil(step.durationSeconds / 60)} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternatives Recommendations Section */}
            {routePlan.alternatives && routePlan.alternatives.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider mb-3 block">Alternative Bypass Routes</h4>
                <div className="space-y-3">
                  {routePlan.alternatives.map((alt, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400">{alt.name}</span>
                        <span className="text-[9px] uppercase font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Bypass Track
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{alt.routeExplanation}</p>
                      <div className="space-y-1 pt-1.5">
                        {alt.steps.map((st, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                            <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </Card>
        )}

      </div>

      {/* Live AI Route Advisor Chatbot & Transport Hub List - Column Right */}
      <div className="lg:col-span-4 space-y-6">

        {/* Gemini Route Advisor Chat Panel */}
        <Card 
          title="Gemini AI Route Advisor" 
          subtitle="Direct dialogue with our live travel concierge regarding safety, ramps, elevators, and transit"
          className="border-sky-500/20 shadow-[0_0_15px_rgba(59,130,246,0.02)]"
        >
          <div className="flex flex-col h-[400px]">
            
            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs border border-slate-850 bg-slate-950 rounded-lg p-3 scrollbar-thin scrollbar-thumb-slate-850">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-sky-600 text-slate-100 font-medium rounded-tr-none' 
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                    <div className={`text-[8px] font-mono mt-1 text-right ${
                      msg.sender === 'user' ? 'text-sky-300' : 'text-slate-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Prompts */}
            <div className="flex flex-wrap gap-1.5 py-2">
              <button 
                onClick={() => handleSendChatMessage("What is the wheelchair route to Gate C?")}
                className="text-[10px] bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
              >
                ♿ Wheelchair to Gate C
              </button>
              <button 
                onClick={() => handleSendChatMessage("How long is the wait at the rail station?")}
                className="text-[10px] bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
              >
                🚉 Rail wait time
              </button>
              <button 
                onClick={() => handleSendChatMessage("Is there any crowd alert on MetLife pathways right now?")}
                className="text-[10px] bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
              >
                🔥 Active bottlenecks?
              </button>
            </div>

            {/* Message Input Box */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Ask our AI Route Advisor..."
                className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-sky-500 placeholder-slate-600"
                disabled={sendingChat}
              />
              <button
                onClick={() => handleSendChatMessage()}
                disabled={sendingChat || !chatMessage.trim()}
                className="bg-sky-600 hover:bg-sky-500 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </Card>

        {/* Public Transport Recommendations */}
        <Card title="Transport Hub Operations" subtitle="Live transit lines, waiting times & sustainability scores">
          <div className="space-y-3 text-xs">
            {transport.length === 0 ? (
              <p className="text-center text-slate-500 py-4 font-mono">No transit updates listed</p>
            ) : (
              transport.map((trn) => (
                <div key={trn.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-center shrink-0">
                      <Bus className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200 font-bold font-sans">{trn.routeOrZone}</span>
                        <span className="text-[9px] uppercase font-mono text-slate-500 bg-slate-900 px-1 py-0.5 rounded">
                          {trn.mode}
                        </span>
                      </div>
                      
                      {/* Wait time and eco score */}
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {trn.estimatedWaitMinutes} min wait
                        </span>
                        <span className="flex items-center gap-1">
                          <Leaf className={`w-3.5 h-3.5 ${getSustainabilityColor(trn.sustainabilityScore)}`} /> 
                          <span className={getSustainabilityColor(trn.sustainabilityScore)}>{trn.sustainabilityScore}/100 Eco</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-1 rounded border shrink-0 ${getStatusColor(trn.status)}`}>
                    {trn.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Smart Parking & Entry Management Gateways */}
        <Card title="Parking Lot Occupancy" subtitle="Tactical outer parking grid occupancy ratings">
          <div className="space-y-2.5 text-xs font-mono">
            
            <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
              <span className="text-slate-300">Lot A (Premium North):</span>
              <span className="font-bold text-rose-400">95% FULL (CLOSED)</span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
              <span className="text-slate-300">Lot C (Main Wheelchair):</span>
              <span className="font-bold text-amber-400">78% OCCUPIED (LIMITED)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
              <span className="text-slate-300">Lot G (General Transit East):</span>
              <span className="font-bold text-emerald-400">42% OCCUPIED (RECOMMENDED)</span>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/15 text-[11px] text-slate-400 rounded-lg p-3 leading-relaxed mt-2 font-sans">
              <span className="font-bold text-sky-400 block mb-0.5">🍃 Green Travel Incentive:</span>
              Match-day transit rail passengers receive 10% food vouchers to encourage sustainable transit and reduce stadium traffic emissions.
            </div>

          </div>
        </Card>

      </div>

    </div>
  );
}
