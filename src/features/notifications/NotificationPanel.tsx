import { Notification } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { AlertCircle, Brain, Radio, Trash2, Check, ArrowUpRight } from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
  markNotificationRead: (id: string) => Promise<boolean>;
  clearAllNotifications: () => Promise<boolean>;
}

export default function NotificationPanel({
  notifications,
  markNotificationRead,
  clearAllNotifications
}: NotificationPanelProps) {
  
  const getPriorityBorder = (prio: string) => {
    switch (prio) {
      case 'critical': return 'border-l-4 border-l-rose-500 bg-rose-500/5';
      case 'high': return 'border-l-4 border-l-amber-500 bg-amber-500/5';
      default: return 'border-l-4 border-l-sky-500 bg-sky-500/5';
    }
  };

  const activeNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans">
      
      <Card 
        title="Alarms & Escalation Workflows" 
        subtitle="Active command priority emergency directives"
        actions={
          activeNotifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="xs" 
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
              onClick={clearAllNotifications}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Alerts
            </Button>
          )
        }
      >
        
        {/* Active notifications list */}
        <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 text-xs">
          {activeNotifications.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg bg-slate-950/20 p-6">
              <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs">No Active Alarms</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                All stadium operations systems are within optimal parameters. No current alarms require triage.
              </p>
            </div>
          ) : (
            activeNotifications.map((not) => (
              <div 
                key={not.id} 
                className={`bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start justify-between gap-4 transition-all hover:border-slate-700 ${getPriorityBorder(not.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {not.type === 'incident' ? (
                      <div className="w-8 h-8 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-bold font-sans text-sm">{not.title}</span>
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 py-0.5 rounded uppercase">
                        {not.priority}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{not.message}</p>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      STAMP: {new Date(not.timestamp).toLocaleTimeString()}
                    </span>

                    {/* Escalate workflow display if present */}
                    {not.escalationWorkflow && (
                      <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg mt-2 text-[11px] text-sky-400 font-mono leading-relaxed flex items-start gap-2">
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">ESCALATION DRILL ACTIVATED:</span>
                          <p className="text-slate-400 mt-0.5">{not.escalationWorkflow}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => markNotificationRead(not.id)}
                  className="p-1.5 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-md transition-colors shrink-0 flex items-center justify-center"
                  aria-label="Dismiss Alert"
                  title="Acknowledge and dismiss"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          {/* Dismissed/History alerts section */}
          {readNotifications.length > 0 && (
            <div className="space-y-2 mt-6 border-t border-slate-800/60 pt-4">
              <h4 className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Dismissed Logs History</h4>
              {readNotifications.map((not) => (
                <div key={not.id} className="bg-slate-950/40 border border-slate-900/80 p-2.5 rounded-lg flex items-center justify-between text-xs opacity-50">
                  <span className="text-slate-400 truncate">{not.title}</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase">ACKNOWLEDGED</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </Card>

    </div>
  );
}
