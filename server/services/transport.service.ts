import { getSupabaseAdmin } from '../lib/supabase';
import { TransportUpdate } from '../types';

const fallbackTransportUpdates: TransportUpdate[] = [
  {
    id: "trans-1",
    stadiumId: "stadium-metlife",
    routeOrZone: "Secaucus Express Shuttle",
    mode: "shuttle",
    estimatedWaitMinutes: 15,
    sustainabilityScore: 88,
    status: "smooth",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "trans-2",
    stadiumId: "stadium-metlife",
    routeOrZone: "NJ Transit Rail (Meadowlands Line)",
    mode: "rail",
    estimatedWaitMinutes: 25,
    sustainabilityScore: 95,
    status: "delayed",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class TransportService {
  /**
   * Retrieves all transit updates.
   */
  static async getAllTransport(limit = 50, offset = 0): Promise<{ transport: TransportUpdate[]; total: number }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { transport: fallbackTransportUpdates.slice(offset, offset + limit), total: fallbackTransportUpdates.length };
    }

    try {
      const { data, error, count } = await supabase
        .from('transport_updates')
        .select('*', { count: 'exact' })
        .order('route_or_zone')
        .range(offset, offset + limit - 1);

      if (error || !data) {
        return { transport: fallbackTransportUpdates.slice(offset, offset + limit), total: fallbackTransportUpdates.length };
      }

      const transport: TransportUpdate[] = (data as any[]).map(t => ({
        id: t.id,
        stadiumId: t.stadium_id,
        routeOrZone: t.route_or_zone,
        mode: t.mode,
        estimatedWaitMinutes: t.estimated_wait_minutes,
        sustainabilityScore: t.sustainability_score,
        status: t.status as any,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at)
      }));

      return { transport, total: count || transport.length };
    } catch {
      return { transport: fallbackTransportUpdates.slice(offset, offset + limit), total: fallbackTransportUpdates.length };
    }
  }

  /**
   * Retrieves transit updates for a specific stadium venue.
   */
  static async getTransportByStadium(stadiumId: string): Promise<TransportUpdate[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return fallbackTransportUpdates.filter(t => t.stadiumId === stadiumId);
    }

    try {
      // Indexed query via idx_transport_stadium_status
      const { data, error } = await supabase
        .from('transport_updates')
        .select('*')
        .eq('stadium_id', stadiumId)
        .order('route_or_zone');

      if (error || !data) {
        return fallbackTransportUpdates.filter(t => t.stadiumId === stadiumId);
      }

      return (data as any[]).map(t => ({
        id: t.id,
        stadiumId: t.stadium_id,
        routeOrZone: t.route_or_zone,
        mode: t.mode,
        estimatedWaitMinutes: t.estimated_wait_minutes,
        sustainabilityScore: t.sustainability_score,
        status: t.status as any,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at)
      }));
    } catch {
      return fallbackTransportUpdates.filter(t => t.stadiumId === stadiumId);
    }
  }
}
