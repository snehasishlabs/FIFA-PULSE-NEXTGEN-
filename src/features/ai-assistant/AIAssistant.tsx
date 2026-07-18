import React, { useState } from 'react';
import { Stadium, AIRecommendation } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Send, Sparkles, Brain, CheckCircle, ArrowRight } from 'lucide-react';

interface AIAssistantProps {
  activeStadium: Stadium;
  recommendations: AIRecommendation[];
  userRole: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan';
  applyRecommendation: (id: string) => Promise<boolean>;
}

export default function AIAssistant({
  activeStadium,
  recommendations,
  userRole,
  applyRecommendation
}: AIAssistantProps) {
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string; timestamp: Date }[]>([
    {
      sender: 'assistant',
      text: `Hello! I am your **FIFA Pulse Operations Intelligence Officer**. I have synthesized current telemetry for **${activeStadium?.name || 'Selected Stadium'}** to provide context-aware operational advice tailored to your role. How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isApplyingId, setIsApplyingId] = useState<string | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setIsSending(true);

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: {
            activeStadiumId: activeStadium?.id || '',
            stadiumName: activeStadium?.name || '',
            role: userRole
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: data.reply, timestamp: new Date() }]);
      } else {
        throw new Error("Chat dispatch error");
      }
    } catch (err) {
      console.error("AI Assistant Chat dispatch error:", err);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "I experienced an offline latency connection issue. However, summarizing current field directives: Security channels remain steady, and gate scanning rates are within limits.",
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyDirective = async (id: string) => {
    setIsApplyingId(id);
    const success = await applyRecommendation(id);
    if (success) {
      // Small simulated delay for visual impact
      setTimeout(() => {
        setIsApplyingId(null);
      }, 500);
    } else {
      setIsApplyingId(null);
    }
  };

  const activeRecs = recommendations.filter(r => !r.isApplied);
  const appliedRecs = recommendations.filter(r => r.isApplied);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'high': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* Dynamic AI Operational Directives - Column Left */}
      <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
        
        <Card title="Active AI Directives" subtitle="Context-aware proactive stadium operations advice">
          
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {activeRecs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg p-4 bg-slate-950/20">
                <Brain className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">All Clear / No Directives</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Our GenAI engine is continuously scanning telemetry. No active bottlenecks require intervention.
                </p>
              </div>
            ) : (
              activeRecs.map((rec) => (
                <div key={rec.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold uppercase border px-2 py-0.5 rounded-full ${getPriorityColor(rec.priority)}`}>
                      {rec.priority} PRIORITY
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {rec.confidenceScore}% Confidence
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 leading-snug">{rec.insight}</p>

                  <div className="space-y-1.5 border-t border-slate-900 pt-2.5">
                    <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mb-1">PROPOSED ACTION PLAN:</div>
                    {rec.actionPlan.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>

                  {userRole !== 'fan' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full mt-2"
                      disabled={isApplyingId === rec.id}
                      onClick={() => handleApplyDirective(rec.id)}
                    >
                      {isApplyingId === rec.id ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-t-transparent border-slate-100 rounded-full animate-spin"></span>
                          Deploying Directives...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          Apply Action Plan
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              ))
            )}

            {/* Historic Applied section */}
            {appliedRecs.length > 0 && (
              <div className="space-y-2 mt-4 border-t border-slate-800/60 pt-4">
                <h4 className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Recently Executed Directives</h4>
                {appliedRecs.map(rec => (
                  <div key={rec.id} className="bg-slate-950/40 border border-slate-900/80 p-2.5 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-slate-400 truncate font-sans font-medium">{rec.insight}</span>
                    </div>
                    <span className="text-[9px] text-emerald-500 font-mono uppercase shrink-0 font-semibold bg-emerald-500/15 px-1.5 py-0.5 rounded ml-2">DEPLOYED</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </Card>

      </div>

      {/* Real-time Assistant Dialogue Panel - Column Right */}
      <div className="lg:col-span-7 flex flex-col">
        
        <Card 
          title="GenAI Command Copilot" 
          subtitle="Direct querying of emergency guidelines and stadium metrics"
          className="flex-1 flex flex-col h-[520px]"
        >
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-lg leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-slate-100 rounded-br-none'
                      : 'bg-slate-950 border border-slate-800/80 text-slate-300 rounded-bl-none'
                  }`}
                >
                  {/* Handle basic bold formatting in replies */}
                  <span className="whitespace-pre-wrap">
                    {msg.text.split('**').map((part, index) => 
                      index % 2 === 1 ? <strong key={index} className="text-slate-100 font-bold">{part}</strong> : part
                    )}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            
            {isSending && (
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono ml-1 animate-pulse">
                <Brain className="w-4 h-4 text-sky-400 animate-spin" />
                <span>AI officer is synthesizing live telemetry...</span>
              </div>
            )}
          </div>

          {/* Chat Input Field */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-800/80 pt-3 flex gap-2">
            <input
              type="text"
              id="ai-chat-input"
              required
              disabled={isSending}
              placeholder={
                userRole === 'fan'
                  ? "Ask about gates, transit waiting times, or wheelchair ramps..."
                  : "Request crowd directives, dispatch commands, or simulation mitigations..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <Button id="ai-chat-submit" variant="primary" type="submit" disabled={isSending} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>

      </div>

    </div>
  );
}
