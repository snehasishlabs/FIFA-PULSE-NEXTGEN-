import { z } from 'zod';

// Zod schema for input sanitization & validation
export const SimulationSchema = z.object({
  stadiumId: z.string().min(1, "Stadium ID is required"),
  scenarioType: z.string().min(3, "Scenario type must be at least 3 characters"),
  intensity: z.enum(['low', 'medium', 'high', 'critical']),
  findings: z.string().min(5, "Findings must be detailed"),
  mitigationPlan: z.string().min(5, "Mitigation plan must be detailed"),
  operatorId: z.string().uuid().optional()
});

export const IncidentSchema = z.object({
  stadiumId: z.string().min(1, "Stadium ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  status: z.enum(['active', 'resolved']).default('active'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['crowd', 'medical', 'security', 'facility', 'weather']),
  location: z.string().min(2, "Location details are required"),
  reporterName: z.string().min(2, "Reporter name is required"),
  reporterId: z.string().uuid().optional()
});

export const RecommendationSchema = z.object({
  stadiumId: z.string().min(1, "Stadium ID is required"),
  insight: z.string().min(5, "Insight must be at least 5 characters"),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  confidenceScore: z.number().min(0).max(100),
  actionPlan: z.array(z.object({
    step: z.number().int().positive(),
    action: z.string().min(2),
    responsibleParty: z.string().min(2)
  })).min(1, "Action plan must contain at least one step"),
  isApplied: z.boolean().default(false)
});

export const NotificationSchema = z.object({
  stadiumId: z.string().min(1, "Stadium ID is required"),
  title: z.string().min(3, "Title is required"),
  message: z.string().min(5, "Message must be descriptive"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  type: z.string().min(2, "Type is required"),
  isRead: z.boolean().default(false),
  escalationWorkflow: z.string().optional()
});

export const StadiumMetricsSchema = z.object({
  stadiumId: z.string().min(1, "Stadium ID is required"),
  attendance: z.number().int().nonnegative("Attendance cannot be negative"),
  crowdDensity: z.number().min(0).max(100, "Crowd density must be between 0 and 100"),
  stadiumHealthScore: z.number().min(0).max(100, "Health score must be between 0 and 100"),
  gateCongestion: z.record(z.string(), z.enum(['low', 'medium', 'high'])),
  resourceUtilization: z.record(z.string(), z.number().min(0).max(100))
});

export const AccessibilityServiceSchema = z.object({
  stadiumId: z.string().min(1, "Stadium ID is required"),
  serviceType: z.string().min(2, "Service type is required"),
  status: z.enum(['operational', 'limited', 'disrupted']),
  locationDetails: z.string().min(3, "Location details are required"),
  lastChecked: z.string().transform((val) => new Date(val)).optional()
});

export const TransportUpdateSchema = z.object({
  stadiumId: z.string().min(1, "Stadium ID is required"),
  routeOrZone: z.string().min(2, "Route or zone is required"),
  mode: z.string().min(2, "Transport mode is required"),
  estimatedWaitMinutes: z.number().int().nonnegative("Wait time cannot be negative"),
  sustainabilityScore: z.number().min(0).max(100, "Sustainability score must be between 0 and 100"),
  status: z.enum(['smooth', 'delayed', 'congested', 'suspended'])
});

export const ProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional()
});

export const AuthMeSchema = z.object({
  email: z.string().email(),
  role: z.enum(['fan', 'volunteer', 'staff', 'organizer', 'admin'])
});
