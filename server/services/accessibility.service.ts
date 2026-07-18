import { getSupabaseAdmin } from '../lib/supabase';
import { AccessibilityService } from '../types';

const fallbackAccessibilityServices: AccessibilityService[] = [
  {
    id: "acc-1",
    stadiumId: "stadium-metlife",
    serviceType: "Elevator 4 (North Concourse)",
    status: "disrupted",
    locationDetails: "Level 1 entrance adjacent to gate A",
    lastChecked: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "acc-2",
    stadiumId: "stadium-metlife",
    serviceType: "Wheelchair Escort Shuttle",
    status: "operational",
    locationDetails: "Circulating Outer Lot G & Lot F",
    lastChecked: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class AccessibilityServiceClass {
  /**
   * Retrieves all accessibility service states.
   */
  static async getAllServices(limit = 50, offset = 0): Promise<{ services: AccessibilityService[]; total: number }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { services: fallbackAccessibilityServices.slice(offset, offset + limit), total: fallbackAccessibilityServices.length };
    }

    try {
      const { data, error, count } = await supabase
        .from('accessibility_services')
        .select('*', { count: 'exact' })
        .order('service_type')
        .range(offset, offset + limit - 1);

      if (error || !data) {
        return { services: fallbackAccessibilityServices.slice(offset, offset + limit), total: fallbackAccessibilityServices.length };
      }

      const services: AccessibilityService[] = (data as any[]).map(a => ({
        id: a.id,
        stadiumId: a.stadium_id,
        serviceType: a.service_type,
        status: a.status as any,
        locationDetails: a.location_details,
        lastChecked: new Date(a.last_checked),
        createdAt: new Date(a.created_at),
        updatedAt: new Date(a.updated_at)
      }));

      return { services, total: count || services.length };
    } catch {
      return { services: [], total: 0 };
    }
  }

  /**
   * Retrieves accessibility service states for a single stadium.
   */
  static async getServicesByStadium(stadiumId: string): Promise<AccessibilityService[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return fallbackAccessibilityServices.filter(a => a.stadiumId === stadiumId);
    }

    try {
      // Indexed query via idx_accessibility_stadium
      const { data, error } = await supabase
        .from('accessibility_services')
        .select('*')
        .eq('stadium_id', stadiumId)
        .order('service_type');

      if (error || !data) {
        return fallbackAccessibilityServices.filter(a => a.stadiumId === stadiumId);
      }

      return (data as any[]).map(a => ({
        id: a.id,
        stadiumId: a.stadium_id,
        serviceType: a.service_type,
        status: a.status as any,
        locationDetails: a.location_details,
        lastChecked: new Date(a.last_checked),
        createdAt: new Date(a.created_at),
        updatedAt: new Date(a.updated_at)
      }));
    } catch {
      return fallbackAccessibilityServices.filter(a => a.stadiumId === stadiumId);
    }
  }
}
