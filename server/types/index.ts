export type UserRole = 'fan' | 'volunteer' | 'staff' | 'organizer' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StadiumMetrics {
  id: string;
  stadiumId: string;
  attendance: number;
  crowdDensity: number;
  stadiumHealthScore: number;
  gateCongestion: Record<string, 'low' | 'medium' | 'high'>;
  resourceUtilization: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  stadiumId: string;
  title: string;
  description: string;
  status: 'active' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'crowd' | 'medical' | 'security' | 'facility' | 'weather';
  location: string;
  reporterName: string;
  reporterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Simulation {
  id: string;
  stadiumId: string;
  scenarioType: string;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  findings: string;
  mitigationPlan: string;
  operatorId?: string;
  createdAt: Date;
}

export interface AIRecommendation {
  id: string;
  stadiumId: string;
  insight: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  actionPlan: Array<{
    step: number;
    action: string;
    responsibleParty: string;
  }>;
  isApplied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  stadiumId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  isRead: boolean;
  escalationWorkflow?: string;
  createdAt: Date;
}

export interface AccessibilityService {
  id: string;
  stadiumId: string;
  serviceType: string;
  status: 'operational' | 'limited' | 'disrupted';
  locationDetails: string;
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransportUpdate {
  id: string;
  stadiumId: string;
  routeOrZone: string;
  mode: string;
  estimatedWaitMinutes: number;
  sustainabilityScore: number;
  status: 'smooth' | 'delayed' | 'congested' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomJWTPayload {
  sub: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}
