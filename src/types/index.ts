export interface User {
  id: string;
  email: string;
  role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan';
  name: string;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  capacity: number;
  latitude: number;
  longitude: number;
}

export interface StadiumMetric {
  id: string;
  stadiumId: string;
  timestamp: string;
  attendance: number;
  crowdDensity: number; // Percentage 0 - 100
  gateCongestion: Record<string, 'low' | 'medium' | 'high'>; // gate_a, gate_b, etc.
  resourceUtilization: {
    security: number; // %
    medical: number; // %
    concessions: number; // %
    transport: number; // %
  };
  stadiumHealthScore: number; // 0 - 100 calculated score
}

export interface Incident {
  id: string;
  stadiumId: string;
  timestamp: string;
  title: string;
  description: string;
  category: 'crowd' | 'medical' | 'security' | 'facility' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'responding' | 'resolved';
  location: string;
  reporterName: string;
  escalationLevel: number;
}

export interface Simulation {
  id: string;
  stadiumId: string;
  timestamp: string;
  scenarioType: 'emergency_evacuation' | 'crowd_surge' | 'weather_disruption' | 'resource_stress_test';
  status: 'running' | 'completed';
  intensity: 'medium' | 'high' | 'extreme';
  findings: string;
  mitigationPlan: string;
}

export interface AIRecommendation {
  id: string;
  timestamp: string;
  category: 'crowd_control' | 'emergency' | 'resource_allocation' | 'logistics';
  priority: 'low' | 'medium' | 'high' | 'critical';
  insight: string;
  actionPlan: string[];
  confidenceScore: number; // 0 - 100
  isApplied: boolean;
}

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'incident' | 'ai_warning' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  escalationWorkflow?: string;
}

export interface AccessibilityService {
  id: string;
  stadiumId: string;
  serviceType: 'elevators' | 'wheelchair_rental' | 'sensory_room' | 'accessible_restrooms' | 'shuttle_service';
  status: 'operational' | 'limited' | 'maintenance';
  locationDetails: string;
  lastChecked: string;
}

export interface TransportUpdate {
  id: string;
  stadiumId: string;
  mode: 'metro' | 'bus' | 'shuttle' | 'rideshare' | 'parking';
  routeOrZone: string;
  status: 'smooth' | 'delayed' | 'congested' | 'suspended';
  estimatedWaitMinutes: number;
  sustainabilityScore: number; // 0-100 rating based on emissions/efficiency
}

export interface IncidentInput {
  stadiumId: string;
  title: string;
  description: string;
  category: 'crowd' | 'medical' | 'security' | 'facility' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  reporterName: string;
}

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface NavigationAlternative {
  name: string;
  routeExplanation: string;
  steps: string[];
}

export interface NavigationRoutePlan {
  routeExplanation: string;
  totalDistanceMeters: number;
  estimatedDurationMinutes: number;
  routeDensityLevel: 'low' | 'medium' | 'high';
  accessibilityRating: 'optimal' | 'limited' | 'not_recommended';
  warnings: string[];
  pathCoordinates: { lat: number; lng: number }[];
  steps: NavigationStep[];
  alternatives: NavigationAlternative[];
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

