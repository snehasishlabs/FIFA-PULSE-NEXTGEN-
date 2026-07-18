import { Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase';
import { Notification } from '../types';

// Central registry for Server-Sent Events (SSE) subscribers
export const sseClients: Response[] = [];

/**
 * Pushes a real-time message stream to all active spectator and operator terminals.
 */
export function broadcastSSE(type: string, data: any): void {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      // client has disconnected, will be cleaned up on close
    }
  });
}

const fallbackNotifications: Notification[] = [
  {
    id: "not-1",
    stadiumId: "stadium-metlife",
    title: "Heavy Entry Congestion at Gate A",
    message: "Queue wait time has exceeded 12 minutes. Spec-flows are being re-routed to Gate B.",
    priority: "high",
    type: "incident",
    isRead: false,
    createdAt: new Date()
  }
];

export class NotificationService {
  /**
   * Registers a new SSE client stream.
   */
  static addSSEClient(res: Response): void {
    sseClients.push(res);
  }

  /**
   * De-registers a closed SSE client stream.
   */
  static removeSSEClient(res: Response): void {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  }

  /**
   * Fetches active or historical notifications.
   */
  static async getNotifications(stadiumId?: string, limit = 20, offset = 0): Promise<{ notifications: Notification[]; total: number }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      let filtered = fallbackNotifications;
      if (stadiumId) filtered = filtered.filter(n => n.stadiumId === stadiumId);
      return { notifications: filtered.slice(offset, offset + limit), total: filtered.length };
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' });

      if (stadiumId) {
        query = query.eq('stadium_id', stadiumId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !data) {
        return { notifications: [], total: 0 };
      }

      const notifications: Notification[] = (data as any[]).map(n => ({
        id: n.id,
        stadiumId: n.stadium_id,
        title: n.title,
        message: n.message,
        priority: n.priority as any,
        type: n.type,
        isRead: n.is_read,
        escalationWorkflow: n.escalation_workflow || undefined,
        createdAt: new Date(n.created_at)
      }));

      return { notifications, total: count || notifications.length };
    } catch {
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Creates a new operational alert and broadcasts it instantly.
   */
  static async createNotification(stadiumId: string, title: string, message: string, priority: 'low' | 'medium' | 'high' | 'critical', type: string, escalationWorkflow?: string): Promise<Notification> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        interface DbNotification {
          id: string;
          stadium_id: string;
          title: string;
          message: string;
          priority: string;
          type: string;
          is_read: boolean;
          escalation_workflow?: string | null;
          created_at: string;
        }

        const insertPayload = {
          stadium_id: stadiumId,
          title,
          message,
          priority,
          type,
          is_read: false,
          escalation_workflow: escalationWorkflow
        };

        const { data, error } = await (supabase
          .from('notifications')
          .insert(insertPayload as unknown as never)
          .select()
          .single() as unknown as Promise<{ data: DbNotification | null; error: any }>);

        if (!error && data) {
          const notification: Notification = {
            id: data.id,
            stadiumId: data.stadium_id,
            title: data.title,
            message: data.message,
            priority: data.priority as any,
            type: data.type,
            isRead: data.is_read,
            escalationWorkflow: data.escalation_workflow || undefined,
            createdAt: new Date(data.created_at)
          };
          
          // Broadcast in Realtime!
          broadcastSSE("NEW_NOTIFICATION", notification);
          return notification;
        }
      } catch (dbErr) {
        console.error("Failed to insert notification into database:", dbErr);
      }
    }

    const fallbackNot: Notification = {
      id: `not-${Math.random().toString(36).substr(2, 9)}`,
      stadiumId,
      title,
      message,
      priority,
      type,
      isRead: false,
      escalationWorkflow,
      createdAt: new Date()
    };
    fallbackNotifications.unshift(fallbackNot);
    broadcastSSE("NEW_NOTIFICATION", fallbackNot);
    return fallbackNot;
  }
}
