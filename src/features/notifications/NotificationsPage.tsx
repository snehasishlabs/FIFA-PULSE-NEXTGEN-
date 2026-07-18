import { useApp } from '../../app/AppContext';
import NotificationPanel from './NotificationPanel';

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    clearAllNotifications
  } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Alarm & Operations Notifications</h2>
          <p className="text-xs text-slate-500 font-mono">LIVE SEVERITY INCIDENTS, ESCALATION WORKFLOWS, AND CORE SYSTEM STATUS ALERTS</p>
        </div>
      </div>

      <NotificationPanel
        notifications={notifications}
        markNotificationRead={markNotificationRead}
        clearAllNotifications={clearAllNotifications}
      />
    </div>
  );
}
