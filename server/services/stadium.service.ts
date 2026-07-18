import { getSupabaseAdmin } from '../lib/supabase';
import { Stadium, StadiumMetrics, Incident } from '../types';

// Static fallbacks for local resiliency and development
const fallbackStadiums: Stadium[] = [
  {
    id: "stadium-metlife",
    name: "MetLife Stadium",
    city: "East Rutherford",
    country: "USA",
    capacity: 82500,
    latitude: 40.8135,
    longitude: -74.0744,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "stadium-sofi",
    name: "SoFi Stadium",
    city: "Inglewood",
    country: "USA",
    capacity: 70240,
    latitude: 33.9534,
    longitude: -118.3390,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "stadium-azteca",
    name: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    capacity: 87523,
    latitude: 19.3029,
    longitude: -99.1505,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const fallbackMetrics: Record<string, StadiumMetrics> = {
  "stadium-metlife": {
    id: "m-1",
    stadiumId: "stadium-metlife",
    attendance: 78450,
    crowdDensity: 82,
    stadiumHealthScore: 84,
    gateCongestion: {
      "Gate A (North)": "high",
      "Gate B (East)": "medium",
      "Gate C (South)": "low"
    },
    resourceUtilization: {
      security: 85,
      medical: 50,
      concessions: 90
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

const fallbackIncidents: Incident[] = [
  {
    id: "inc-1",
    stadiumId: "stadium-metlife",
    title: "Blocked wheelchair ramp",
    description: "A media broadcast cable is obstructing the main accessible ramp at Gate C.",
    status: "active",
    severity: "high",
    category: "facility",
    location: "Gate C Outer Ramp",
    reporterName: "Carlos (Supervisor)",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

interface DbStadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

interface DbStadiumMetrics {
  id: string;
  stadium_id: string;
  attendance: number;
  crowd_density: number;
  stadium_health_score: number;
  gate_congestion: any;
  resource_utilization: any;
  created_at: string;
  updated_at: string;
}

export class StadiumService {
  /**
   * Fetches all stadiums.
   */
  static async getAllStadiums(): Promise<Stadium[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return fallbackStadiums;

    try {
      const { data, error } = await supabase
        .from('stadiums')
        .select('*')
        .order('name');

      if (error || !data || data.length === 0) {
        return fallbackStadiums;
      }

      return (data as any[]).map(s => ({
        id: s.id,
        name: s.name,
        city: s.city,
        country: s.country || "USA",
        capacity: s.capacity,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at)
      }));
    } catch (err) {
      console.warn("Error loading stadiums from database, falling back to static mock:", err);
      return fallbackStadiums;
    }
  }

  /**
   * Fetches a single stadium by ID.
   */
  static async getStadiumById(id: string): Promise<Stadium | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return fallbackStadiums.find(s => s.id === id) || null;
    }

    try {
      const { data, error } = await (supabase
        .from('stadiums')
        .select('*')
        .eq('id', id)
        .single() as unknown as Promise<{ data: DbStadium | null; error: any }>);

      if (error || !data) {
        return fallbackStadiums.find(s => s.id === id) || null;
      }

      return {
        id: data.id,
        name: data.name,
        city: data.city,
        country: data.country || "USA",
        capacity: data.capacity,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch {
      return fallbackStadiums.find(s => s.id === id) || null;
    }
  }

  /**
   * Fetches the latest live metrics for a stadium.
   */
  static async getStadiumMetrics(stadiumId: string): Promise<StadiumMetrics | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return fallbackMetrics[stadiumId] || null;
    }

    try {
      // Indexed query via idx_metrics_stadium_id
      const { data, error } = await (supabase
        .from('stadium_metrics')
        .select('*')
        .eq('stadium_id', stadiumId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as unknown as Promise<{ data: DbStadiumMetrics | null; error: any }>);

      if (error || !data) {
        return fallbackMetrics[stadiumId] || null;
      }

      return {
        id: data.id,
        stadiumId: data.stadium_id,
        attendance: data.attendance,
        crowdDensity: Number(data.crowd_density),
        stadiumHealthScore: data.stadium_health_score,
        gateCongestion: data.gate_congestion,
        resourceUtilization: data.resource_utilization,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch {
      return fallbackMetrics[stadiumId] || null;
    }
  }

  /**
   * Fetches active incidents for a stadium.
   */
  static async getStadiumIncidents(stadiumId: string, limit = 10, offset = 0): Promise<{ incidents: Incident[]; total: number }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const filtered = fallbackIncidents.filter(i => i.stadiumId === stadiumId);
      return { incidents: filtered.slice(offset, offset + limit), total: filtered.length };
    }

    try {
      // Indexed query via idx_incidents_stadium_status
      const { data, error, count } = await supabase
        .from('incidents')
        .select('*', { count: 'exact' })
        .eq('stadium_id', stadiumId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !data) {
        const filtered = fallbackIncidents.filter(i => i.stadiumId === stadiumId);
        return { incidents: filtered.slice(offset, offset + limit), total: filtered.length };
      }

      const incidents: Incident[] = (data as any[]).map(i => ({
        id: i.id,
        stadiumId: i.stadium_id,
        title: i.title,
        description: i.description,
        status: i.status as 'active' | 'resolved',
        severity: i.severity as 'low' | 'medium' | 'high' | 'critical',
        category: i.category as 'crowd' | 'medical' | 'security' | 'facility' | 'weather',
        location: i.location,
        reporterName: i.reporter_name,
        reporterId: i.reporter_id,
        createdAt: new Date(i.created_at),
        updatedAt: new Date(i.updated_at)
      }));

      return { incidents, total: count || incidents.length };
    } catch {
      const filtered = fallbackIncidents.filter(i => i.stadiumId === stadiumId);
      return { incidents: filtered.slice(offset, offset + limit), total: filtered.length };
    }
  }
}
