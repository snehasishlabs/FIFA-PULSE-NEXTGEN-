import "express-async-errors";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { executeAllTests } from "./src/tests/runTests";
import rootRouter from "./server/routes/index";
import { runBackendTests } from "./server/tests/backend.test";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { errorHandler, setupProcessHandlers } from "./server/middleware/errorHandler";

dotenv.config();

// Setup global uncaughtException/unhandledRejection handlers
setupProcessHandlers();

const app = express();

// Trust reverse proxy in production/cloud environments
app.set('trust proxy', 1);

// Security middleware configured to allow iframe embedding in AI Studio preview
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
app.use("/api/", limiter);

app.use(express.json());

// Mount the modular production-grade backend router
app.use("/api", rootRouter);
const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// ============================================================================
// SUPABASE BACKEND CLIENT INTEGRATION
// ============================================================================

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      supabaseAdmin = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
      console.log("Supabase Admin Service Role Client initialized successfully.");
      return supabaseAdmin;
    } catch (err) {
      console.error("Failed to initialize Supabase admin client:", err);
    }
  }
  return null;
}

// Config Endpoint to securely pass anon keys to the frontend
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ""
  });
});

// ============================================================================
// MOCK DATABASE & STATE ENGINE
// ============================================================================

// Prepopulated stadiums
const stadiums = [
  {
    id: "stadium-metlife",
    name: "MetLife Stadium",
    city: "East Rutherford, NJ",
    capacity: 82500,
    latitude: 40.8135,
    longitude: -74.0744,
  },
  {
    id: "stadium-sofi",
    name: "SoFi Stadium",
    city: "Inglewood, CA",
    capacity: 70240,
    latitude: 33.9534,
    longitude: -118.3390,
  },
  {
    id: "stadium-azteca",
    name: "Estadio Azteca",
    city: "Mexico City, Mexico",
    capacity: 87523,
    latitude: 19.3029,
    longitude: -99.1505,
  }
];

// Active user session simulation (role toggleable via UI for evaluation)
let activeUser: {
  id: string;
  email: string;
  role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan';
  name: string;
} | null = null;

// Real-time Stadium Metrics
let stadiumMetrics: Record<string, any> = {
  "stadium-metlife": {
    stadiumId: "stadium-metlife",
    timestamp: new Date().toISOString(),
    attendance: 78450,
    crowdDensity: 82, // %
    gateCongestion: {
      "Gate A (North)": "high",
      "Gate B (East)": "medium",
      "Gate C (South)": "low",
      "Gate D (West)": "high"
    },
    resourceUtilization: {
      security: 85,
      medical: 50,
      concessions: 90,
      transport: 75
    },
    stadiumHealthScore: 84
  },
  "stadium-sofi": {
    stadiumId: "stadium-sofi",
    timestamp: new Date().toISOString(),
    attendance: 65120,
    crowdDensity: 74,
    gateCongestion: {
      "Gate 1 (Main)": "medium",
      "Gate 2 (VIP)": "low",
      "Gate 3 (East)": "medium",
      "Gate 4 (West)": "medium"
    },
    resourceUtilization: {
      security: 70,
      medical: 40,
      concessions: 80,
      transport: 65
    },
    stadiumHealthScore: 91
  },
  "stadium-azteca": {
    stadiumId: "stadium-azteca",
    timestamp: new Date().toISOString(),
    attendance: 84100,
    crowdDensity: 91,
    gateCongestion: {
      "Acceso 1": "high",
      "Acceso 2": "high",
      "Acceso 3": "medium",
      "Acceso 4": "low"
    },
    resourceUtilization: {
      security: 90,
      medical: 65,
      concessions: 95,
      transport: 85
    },
    stadiumHealthScore: 78
  }
};

// Active Incidents
let incidents = [
  {
    id: "inc-1",
    stadiumId: "stadium-metlife",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    title: "Medical assistance requested at Section 124",
    description: "Spectator showing signs of heat exhaustion. Medical response team dispatched.",
    category: "medical",
    severity: "medium",
    status: "responding",
    location: "Section 124, Row M",
    reporterName: "John Doe (Volunteer)",
    escalationLevel: 2
  },
  {
    id: "inc-2",
    stadiumId: "stadium-metlife",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    title: "Crowd surge warning at Gate A",
    description: "Heavy congestion detected during entry sweep. Security reorganizing queue barriers.",
    category: "crowd",
    severity: "high",
    status: "reported",
    location: "Outer Plaza Gate A",
    reporterName: "Security Guard #42",
    escalationLevel: 3
  },
  {
    id: "inc-3",
    stadiumId: "stadium-azteca",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    title: "Minor power fluctuation at West Concourse",
    description: "Backup generators active for concourse lighting. Main power restored shortly.",
    category: "facility",
    severity: "low",
    status: "resolved",
    location: "Level 2 Concourse West",
    reporterName: "System Alert",
    escalationLevel: 1
  }
];

// Simulations
let simulations = [
  {
    id: "sim-1",
    stadiumId: "stadium-metlife",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    scenarioType: "crowd_surge",
    status: "completed",
    intensity: "high",
    findings: "Gate D experienced a 45% surge in entry requests due to train shuttle arrivals. Secondary queuing guides were required to avoid bottlenecks.",
    mitigationPlan: "Pre-emptively route 20% of transit passengers to Gate C, deploy volunteer helpers with signs at transit terminals, dynamic screen notifications."
  }
];

// Accessibility Services Status
let accessibilityServices = [
  {
    id: "acc-1",
    stadiumId: "stadium-metlife",
    serviceType: "elevators",
    status: "operational",
    locationDetails: "Core West and Core East banks",
    lastChecked: new Date().toISOString()
  },
  {
    id: "acc-2",
    stadiumId: "stadium-metlife",
    serviceType: "wheelchair_rental",
    status: "operational",
    locationDetails: "Guest Services Desk inside Gate A",
    lastChecked: new Date().toISOString()
  },
  {
    id: "acc-3",
    stadiumId: "stadium-metlife",
    serviceType: "sensory_room",
    status: "operational",
    locationDetails: "Suite Level, Section 202A",
    lastChecked: new Date().toISOString()
  },
  {
    id: "acc-4",
    stadiumId: "stadium-sofi",
    serviceType: "elevators",
    status: "operational",
    locationDetails: "All levels accessible",
    lastChecked: new Date().toISOString()
  },
  {
    id: "acc-5",
    stadiumId: "stadium-sofi",
    serviceType: "shuttle_service",
    status: "limited",
    locationDetails: "Parking Lot C to Gate 2",
    lastChecked: new Date().toISOString()
  }
];

// Public Transport Updates
let transportUpdates = [
  {
    id: "trn-1",
    stadiumId: "stadium-metlife",
    mode: "metro",
    routeOrZone: "Meadowlands Rail Line",
    status: "congested",
    estimatedWaitMinutes: 25,
    sustainabilityScore: 92, // rail is eco-friendly
    updatedAt: new Date().toISOString()
  },
  {
    id: "trn-2",
    stadiumId: "stadium-metlife",
    mode: "bus",
    routeOrZone: "NYC Express Bus Shuttle",
    status: "smooth",
    estimatedWaitMinutes: 10,
    sustainabilityScore: 80,
    updatedAt: new Date().toISOString()
  },
  {
    id: "trn-3",
    stadiumId: "stadium-metlife",
    mode: "parking",
    routeOrZone: "Lot G (Accessible)",
    status: "smooth",
    estimatedWaitMinutes: 5,
    sustainabilityScore: 20,
    updatedAt: new Date().toISOString()
  }
];

// Active Operational Notifications
let notifications = [
  {
    id: "not-1",
    timestamp: new Date().toISOString(),
    title: "CRITICAL: Crowd Density Spike",
    message: "Gate D congestion has reached high alert. Security team mobilization requested.",
    type: "incident",
    priority: "critical",
    isRead: false,
    escalationWorkflow: "Workflow #12: Direct Gate D overflow to South Concourse Gates"
  },
  {
    id: "not-2",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    title: "AI Recommendation Generated",
    message: "Dynamic transit optimization recommended based on low NYC Express shuttle queue.",
    type: "ai_warning",
    priority: "medium",
    isRead: false
  }
];

// AI Recommendations generated over time
let aiRecommendations = [
  {
    id: "rec-1",
    timestamp: new Date().toISOString(),
    category: "crowd_control",
    priority: "high",
    insight: "Crowd density at Gate A exceeds optimal safe limits. An incoming flow of 2,400 additional rail passengers is expected within 15 minutes.",
    actionPlan: [
      "Activate dynamic electronic signage at the train platform directing 30% of fans to under-utilized Gate B.",
      "Deploy 10 volunteer pathfinders with high-visibility megaphones at Transit Plaza West.",
      "Stagger ticket scans by introducing wide pre-screening checkpoints."
    ],
    confidenceScore: 94,
    isApplied: false
  },
  {
    id: "rec-2",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: "resource_allocation",
    priority: "medium",
    insight: "Concessions at Section 300 showing 95% utility while Section 100 is at 45%.",
    actionPlan: [
      "Broadcast mobile app notifications with 15% discount for concession stands at Level 1.",
      "Update digital direction boards to show lower wait times on Level 1 food courts."
    ],
    confidenceScore: 82,
    isApplied: true
  }
];

// List of connected SSE clients for Real-Time Updates (Supabase Realtime Simulation!)
let sseClients: any[] = [];

function broadcastStateUpdate(type: string, data: any) {
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  });
}

// Automatically update metrics or trigger mock alerts every 30 seconds to simulate dynamic match day life!
setInterval(() => {
  // Slightly adjust stadium metrics
  stadiums.forEach(stadium => {
    const metric = stadiumMetrics[stadium.id];
    if (metric) {
      // Small fluctuation
      metric.attendance = Math.min(stadium.capacity, Math.max(1000, metric.attendance + Math.floor(Math.random() * 200 - 100)));
      metric.crowdDensity = Math.min(100, Math.max(10, Math.floor((metric.attendance / stadium.capacity) * 100)));
      metric.timestamp = new Date().toISOString();
      
      // Dynamic health score calculation
      let health = 100;
      if (metric.crowdDensity > 90) health -= 15;
      else if (metric.crowdDensity > 80) health -= 5;
      
      // Check high congestion gates
      const gates = Object.values(metric.gateCongestion);
      const highGates = gates.filter(v => v === 'high').length;
      health -= (highGates * 8);

      const activeStadiumIncidents = incidents.filter(i => i.stadiumId === stadium.id && i.status !== 'resolved');
      health -= (activeStadiumIncidents.length * 10);
      metric.stadiumHealthScore = Math.max(10, Math.min(100, health));
    }
  });

  broadcastStateUpdate("METRICS_UPDATE", stadiumMetrics);
}, 20000);

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Simulated Auth Session Endpoint
app.get("/api/auth/session", (req, res) => {
  res.json({ session: { user: activeUser } });
});

// Simulated Auth Toggle Role (Highly useful for QA, evaluating screen state / permissions)
const SetRoleSchema = z.object({
  role: z.enum(['admin', 'operations', 'venue_staff', 'volunteer', 'fan']),
  name: z.string()
});

app.post("/api/auth/set-role", (req, res) => {
  try {
    const body = SetRoleSchema.parse(req.body);
    activeUser = {
      id: "user-123",
      email: `${body.role}@fifapulse.ai`,
      role: body.role,
      name: body.name
    };
    res.json({ status: "success", user: activeUser });
    broadcastStateUpdate("AUTH_UPDATE", activeUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  activeUser = null;
  res.json({ status: "success" });
  broadcastStateUpdate("AUTH_UPDATE", null);
});

// Stadiums List
app.get("/api/stadiums", async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('stadiums').select('*');
    if (!error && data && data.length > 0) {
      const formatted = (data as any[]).map(s => ({
        id: s.id,
        name: s.name,
        city: s.city,
        capacity: s.capacity,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude)
      }));
      return res.json({ stadiums: formatted });
    }
  }
  res.json({ stadiums });
});

// Current Stadium Metrics
app.get("/api/metrics", async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('stadium_metrics').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const metricsMap: Record<string, any> = {};
      (data as any[]).forEach(m => {
        if (!metricsMap[m.stadium_id]) {
          metricsMap[m.stadium_id] = {
            id: m.id,
            stadiumId: m.stadium_id,
            timestamp: m.created_at,
            attendance: m.attendance,
            crowdDensity: Number(m.crowd_density),
            gateCongestion: m.gate_congestion,
            resourceUtilization: m.resource_utilization,
            stadiumHealthScore: m.stadium_health_score
          };
        }
      });
      return res.json({ metrics: metricsMap });
    }
  }
  res.json({ metrics: stadiumMetrics });
});

// Incidents Endpoints
app.get("/api/incidents", async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = (data as any[]).map(i => ({
        id: i.id,
        stadiumId: i.stadium_id,
        timestamp: i.created_at,
        title: i.title,
        description: i.description,
        category: i.category,
        severity: i.severity,
        status: i.status === 'resolved' ? 'resolved' : 'reported',
        location: i.location,
        reporterName: i.reporter_name,
        escalationLevel: i.severity === 'critical' ? 5 : i.severity === 'high' ? 3 : 1
      }));
      return res.json({ incidents: formatted });
    }
  }
  res.json({ incidents });
});

const ReportIncidentSchema = z.object({
  stadiumId: z.string(),
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.enum(['crowd', 'medical', 'security', 'facility', 'weather']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string().min(2),
  reporterName: z.string()
});

app.post("/api/incidents/report", (req, res) => {
  try {
    const data = ReportIncidentSchema.parse(req.body);
    const newIncident = {
      id: "inc-" + Math.random().toString(36).substr(2, 9),
      stadiumId: data.stadiumId,
      timestamp: new Date().toISOString(),
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: "reported" as const,
      location: data.location,
      reporterName: data.reporterName,
      escalationLevel: data.severity === 'critical' ? 5 : data.severity === 'high' ? 3 : 1
    };

    incidents.unshift(newIncident);

    // Create a corresponding real-time operational notification
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };
    const newNotification = {
      id: "not-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      title: `NEW INCIDENT: ${data.title}`,
      message: `${data.description} reported at ${data.location}. Escalating workflow.`,
      type: "incident" as const,
      priority: priorityMap[data.severity] || 'medium',
      isRead: false,
      escalationWorkflow: data.severity === 'critical' ? "Workflow #1: Full Command Center Alert & Emergency Services Dispatch" : undefined
    };
    notifications.unshift(newNotification);

    res.json({ status: "success", incident: newIncident });
    broadcastStateUpdate("INCIDENT_ADDED", { incident: newIncident, notification: newNotification });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const ResolveIncidentSchema = z.object({
  id: z.string()
});

app.post("/api/incidents/resolve", (req, res) => {
  try {
    const { id } = ResolveIncidentSchema.parse(req.body);
    const index = incidents.findIndex(i => i.id === id);
    if (index !== -1) {
      incidents[index].status = "resolved";
      res.json({ status: "success", incident: incidents[index] });
      broadcastStateUpdate("INCIDENT_RESOLVED", incidents[index]);
    } else {
      res.status(404).json({ error: "Incident not found" });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Simulation List
app.get("/api/simulations", async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('simulations').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = (data as any[]).map(s => ({
        id: s.id,
        stadiumId: s.stadium_id,
        timestamp: s.created_at,
        scenarioType: s.scenario_type,
        status: 'completed',
        intensity: s.intensity,
        findings: s.findings,
        mitigationPlan: s.mitigation_plan
      }));
      return res.json({ simulations: formatted });
    }
  }
  res.json({ simulations });
});

// Run dynamic GenAI-powered simulation!
const RunSimulationSchema = z.object({
  stadiumId: z.string(),
  scenarioType: z.enum(['emergency_evacuation', 'crowd_surge', 'weather_disruption', 'resource_stress_test']),
  intensity: z.enum(['medium', 'high', 'extreme'])
});

app.post("/api/simulations/run", async (req, res) => {
  try {
    const data = RunSimulationSchema.parse(req.body);
    const targetStadium = stadiums.find(s => s.id === data.stadiumId);
    if (!targetStadium) {
      return res.status(404).json({ error: "Stadium not found" });
    }

    // Call Gemini API to generate the simulation scenario, impact analysis, and complex mitigation plan!
    const prompt = `You are a FIFA World Cup 2026 Emergency Coordinator and Stadium Operations expert.
Generate a realistic, detailed simulation report for ${targetStadium.name} in ${targetStadium.city} during a match with 80,000+ attendance.
Scenario Type: ${data.scenarioType.replace('_', ' ').toUpperCase()}
Scenario Intensity: ${data.intensity.toUpperCase()}

Return a JSON object exactly matching the schema below.
Ensure all descriptions are professional, specific, realistic to stadium logistics, and immediately actionable.

JSON Schema:
{
  "findings": "A comprehensive paragraph describing what happened during the peak stress test (including specific locations, bottle-necks, response times).",
  "mitigationPlan": "A highly specific step-by-step mitigation plan consisting of 3-4 professional protocols.",
  "simulatedIncident": {
    "title": "Title of a secondary incident spawned by this scenario (e.g. queue crush at main gate, sensory room overload)",
    "description": "Short description of the spawned incident.",
    "category": "crowd" or "medical" or "security" or "facility" or "weather",
    "severity": "low" or "medium" or "high" or "critical",
    "location": "A specific location in or near the stadium"
  }
}
Return only valid JSON. Do not write any markdown code blocks or wrapper text.`;

    let findings = "Heavy congestion resolved via pre-staging security personnel. Transit lanes redirected.";
    let mitigation = "1. Deploy shuttle fleet immediately.\n2. Reroute accessible queues.\n3. Broadcast real-time announcements.";
    let spawnedIncident = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const text = response.text || "";
        const result = JSON.parse(text);
        findings = result.findings || findings;
        mitigation = result.mitigationPlan || mitigation;
        spawnedIncident = result.simulatedIncident;
      } catch (geminiError) {
        console.error("Gemini API simulation error: ", geminiError);
        // Fallback gracefully to high-quality procedural generator if Gemini fails/key not set
      }
    }

    // If Gemini key was not available or failed, generate high-quality fallback based on scenario type
    if (!spawnedIncident) {
      if (data.scenarioType === 'crowd_surge') {
        findings = `Peak attendance caused massive queue bottlenecks at Gate A. Density reached critical level of 4.5 people/m² near transport entry gates. Crowd speed decreased to < 0.2 m/s.`;
        mitigation = `1. Reroute 35% of arriving spectators to Gate B via transit announcement.
2. Stagger gate turnstiles to throttle incoming flow.
3. Deploy 15 additional tactical crowd-control volunteers with megaphones.`;
        spawnedIncident = {
          title: "Crowd Surge Congestion Bottleneck at Gate A",
          description: "Massive influx of rail passengers causing heavy bottleneck at ticket gates.",
          category: "crowd" as const,
          severity: "high" as const,
          location: "Gate A Entry Plaza"
        };
      } else if (data.scenarioType === 'emergency_evacuation') {
        findings = `Evacuation stress testing simulated an orderly exit of South Stand. Total egress time clocked at 8 minutes and 42 seconds, within safe parameters but limited by sensory congestion.`;
        mitigation = `1. Activate secondary emergency routes adjacent to concessions.
2. Prioritize elevator priority protocols for wheelchair users.
3. Coordinate with municipal transport to double rail shuttle frequency.`;
        spawnedIncident = {
          title: "Sensory Room Overflow during Drill",
          description: "Emergency alarms triggered elevated stress causing higher demand at sensory rooms.",
          category: "medical" as const,
          severity: "medium" as const,
          location: "Suite Level Section 202A"
        };
      } else {
        findings = `Weather stress test simulated immediate crowd sheltering during a lightning delay. Severe congestion detected under the concourse covers.`;
        mitigation = `1. Broadcast stadium shelters notifications.
2. Pause all outer perimeter gate scans.
3. Position volunteers at outer ramps to guide fans inside immediately.`;
        spawnedIncident = {
          title: "Severe Weather Shelter Crowding",
          description: "Lightning threat required fans to seek cover, creating high density in concourses.",
          category: "weather" as const,
          severity: "high" as const,
          location: "Upper Deck Concourse"
        };
      }
    }

    const newSimulation = {
      id: "sim-" + Math.random().toString(36).substr(2, 9),
      stadiumId: data.stadiumId,
      timestamp: new Date().toISOString(),
      scenarioType: data.scenarioType,
      status: "completed" as const,
      intensity: data.intensity,
      findings,
      mitigationPlan: mitigation
    };

    simulations.unshift(newSimulation);

    // If an incident was spawned, add it!
    if (spawnedIncident) {
      const newInc = {
        id: "inc-" + Math.random().toString(36).substr(2, 9),
        stadiumId: data.stadiumId,
        timestamp: new Date().toISOString(),
        title: spawnedIncident.title,
        description: spawnedIncident.description,
        category: spawnedIncident.category,
        severity: spawnedIncident.severity,
        status: "reported" as const,
        location: spawnedIncident.location,
        reporterName: "AI Simulator Coordinator",
        escalationLevel: spawnedIncident.severity === 'critical' ? 5 : spawnedIncident.severity === 'high' ? 3 : 1
      };
      incidents.unshift(newInc);

      // Create simulation notification
      const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
        'low': 'low',
        'medium': 'medium',
        'high': 'high',
        'critical': 'critical'
      };
      const newNotification = {
        id: "not-" + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        title: `SIMULATION COMPLETED: ${data.scenarioType.replace('_', ' ').toUpperCase()}`,
        message: `Simulation triggered incident: ${newInc.title} at ${newInc.location}.`,
        type: "ai_warning" as const,
        priority: priorityMap[newInc.severity] || 'medium',
        isRead: false
      };
      notifications.unshift(newNotification);

      // Dynamically update the stadium metrics to represent the surge/emergency state!
      const metric = stadiumMetrics[data.stadiumId];
      if (metric) {
        metric.crowdDensity = data.scenarioType === 'crowd_surge' ? 94 : 85;
        metric.gateCongestion["Gate A (North)"] = "high";
        metric.gateCongestion["Gate D (West)"] = "high";
        metric.stadiumHealthScore = Math.max(20, metric.stadiumHealthScore - 25);
      }

      broadcastStateUpdate("SIMULATION_RUN", { simulation: newSimulation, incident: newInc, notification: newNotification, metrics: stadiumMetrics });
    } else {
      broadcastStateUpdate("SIMULATION_RUN", { simulation: newSimulation });
    }

    res.json({ status: "success", simulation: newSimulation });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// AI Recommendations List
app.get("/api/ai-assistant/recommendations", (req, res) => {
  res.json({ recommendations: aiRecommendations });
});

// Apply AI Recommendation
app.post("/api/ai-assistant/recommendations/apply", (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.body);
    const index = aiRecommendations.findIndex(r => r.id === id);
    if (index !== -1) {
      aiRecommendations[index].isApplied = true;
      
      // Post system notification
      const newNot = {
        id: "not-" + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        title: "Recommendation Applied Successfully",
        message: `Operational mitigation directive activated for category: ${aiRecommendations[index].category.toUpperCase()}.`,
        type: "system" as const,
        priority: "low" as const,
        isRead: false
      };
      notifications.unshift(newNot);

      // Adjust metrics as a result of applying recommendation
      // e.g. lower gate congestion & improve stadium health score!
      stadiums.forEach(stadium => {
        const metric = stadiumMetrics[stadium.id];
        if (metric) {
          metric.stadiumHealthScore = Math.min(100, metric.stadiumHealthScore + 8);
          if (metric.gateCongestion["Gate A (North)"] === "high") {
            metric.gateCongestion["Gate A (North)"] = "medium";
          }
        }
      });

      res.json({ status: "success", recommendation: aiRecommendations[index] });
      broadcastStateUpdate("RECOMMENDATION_APPLIED", { recommendation: aiRecommendations[index], notification: newNot, metrics: stadiumMetrics });
    } else {
      res.status(404).json({ error: "Recommendation not found" });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// AI Operations Assistant Chat Powered by Gemini
const AIChatSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    activeStadiumId: z.string(),
    stadiumName: z.string(),
    role: z.string()
  })
});

app.post("/api/ai-assistant/chat", async (req, res) => {
  try {
    const { message, context } = AIChatSchema.parse(req.body);
    const metrics = stadiumMetrics[context.activeStadiumId] || {};
    const activeIncidents = incidents.filter(i => i.stadiumId === context.activeStadiumId && i.status !== 'resolved');
    const accessibility = accessibilityServices.filter(a => a.stadiumId === context.activeStadiumId);
    const transit = transportUpdates.filter(t => t.stadiumId === context.activeStadiumId);

    const prompt = `You are the FIFA Pulse AI NextGen Assistant, a staff-facing operations intelligence officer for the FIFA World Cup 2026.
You are assisting ${activeUser?.name || "Guest"} holding the operational role: '${context.role.toUpperCase()}'.
The user is viewing stadium: ${context.stadiumName}.

CURRENT REAL-TIME STADIUM METRICS:
- Attendance: ${metrics.attendance || 'Unknown'} / Capacity: ${stadiums.find(s => s.id === context.activeStadiumId)?.capacity || 'Unknown'}
- Crowd Density: ${metrics.crowdDensity || 0}%
- Stadium Health Score: ${metrics.stadiumHealthScore || 100}/100
- Gate Status: ${JSON.stringify(metrics.gateCongestion || {})}
- Resource Utilization: ${JSON.stringify(metrics.resourceUtilization || {})}

ACTIVE INCIDENTS:
${activeIncidents.length === 0 ? '- None' : activeIncidents.map(i => `- [${i.severity.toUpperCase()}] ${i.title} at ${i.location} (Status: ${i.status})`).join('\n')}

ACCESSIBILITY STATUS:
${accessibility.map(a => `- ${a.serviceType.replace('_', ' ')}: ${a.status} (${a.locationDetails})`).join('\n')}

TRANSPORTATION & PARKING VISIBILITY:
${transit.map(t => `- ${t.mode.toUpperCase()} Line/Zone: ${t.routeOrZone} is currently ${t.status.toUpperCase()} (Wait time: ${t.estimatedWaitMinutes} mins, Eco Score: ${t.sustainabilityScore}/100)`).join('\n')}

USER QUESTION: "${message}"

Write a concise, expert, and highly action-oriented response. Give specific operational directions, crowd mitigation advice, transit recommendations, or accessibility priorities tailored to their specific operational role. Avoid generic fluff. Use bullet points for clear, rapid scannability on a busy match day. Ensure your response is professional and fully context-aware. Keep formatting clean.`;

    let reply = "I am ready to assist. Please verify your Gemini API key in the panel if you require live intelligence, otherwise here is our standard operational directive: Proceed with Gate monitoring and volunteer deployment to Gates showing elevated density.";

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        reply = response.text || reply;
      } catch (geminiError: any) {
        console.error("Gemini Assistant Chat Error: ", geminiError);
        reply = `I ran into an issue communicating with the core intelligence server. However, analyzing our current telemetry: we have ${activeIncidents.length} active incidents, and Gate D queue times are currently elevated. I recommend dispatching venue helpers from concessions (utilization at 90%) to provide navigation support at Gate D.`;
      }
    } else {
      // High-quality mock response based on current metrics
      reply = `**FIFA Pulse AI Assistant (Operational Overview)**:
Analyzing telemetry for **${context.stadiumName}** under your role as **${context.role.toUpperCase()}**:
* **Crowd Density Alert**: Crowd density is at ${metrics.crowdDensity}%. Gate congestion indicates *High* levels at key entrances. I recommend deploying volunteer pathway coordinators.
* **Incidents Priority**: There are currently **${activeIncidents.length}** active incidents requiring attention. Section medical team is currently responding.
* **Accessibility Alert**: Elevators are fully operational, but parking shuttles are under *Limited* service. Please coordinate with Lot C volunteers to provide manual wheelchair support.
* **Transit Recommendations**: Metro service Meadowlands is showing delays (25 mins wait). Direct exiting fans to nyc shuttle bus system which is currently running *Smoothly*.`;
    }

    res.json({ reply });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Accessibility services status
app.get("/api/accessibility/services", async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('accessibility_services').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = (data as any[]).map(a => ({
        id: a.id,
        stadiumId: a.stadium_id,
        serviceType: a.service_type,
        status: a.status,
        locationDetails: a.location_details,
        lastChecked: a.last_checked
      }));
      return res.json({ services: formatted });
    }
  }
  res.json({ services: accessibilityServices });
});

// Transit status updates
app.get("/api/transport", async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('transport_updates').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = (data as any[]).map(t => ({
        id: t.id,
        stadiumId: t.stadium_id,
        mode: t.mode,
        routeOrZone: t.route_or_zone,
        status: t.status,
        estimatedWaitMinutes: t.estimated_wait_minutes,
        sustainabilityScore: t.sustainability_score
      }));
      return res.json({ transport: formatted });
    }
  }
  res.json({ transport: transportUpdates });
});

// Notifications update
app.get("/api/notifications", async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = (data as any[]).map(n => ({
        id: n.id,
        timestamp: n.created_at,
        title: n.title,
        message: n.message,
        type: n.type === 'ai_directive' ? 'ai_warning' : 'incident',
        priority: n.priority,
        isRead: n.is_read,
        escalationWorkflow: n.escalation_workflow
      }));
      return res.json({ notifications: formatted });
    }
  }
  res.json({ notifications });
});

app.post("/api/notifications/mark-read", (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.body);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      res.json({ status: "success", notification: notifications[index] });
      broadcastStateUpdate("NOTIFICATION_READ", notifications[index]);
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Clear all notifications helper
app.post("/api/notifications/clear", (req, res) => {
  notifications.forEach(n => n.isRead = true);
  res.json({ status: "success" });
  broadcastStateUpdate("NOTIFICATIONS_CLEARED", null);
});

// Real-Time SSE Stream (Supabase Realtime subscription emulation!)
app.get("/api/realtime/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.push(res);

  // Send initial data handshake
  res.write(`data: ${JSON.stringify({ type: "INITIAL_HANDSHAKE", data: { activeUser } })}\n\n`);

  req.on("close", () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});


// ============================================================================
// VITE OR STATIC SERVING MIDDLEWARE
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Register centralized global error handler middleware
  app.use(errorHandler);

  // Execute compliance & QA unit suite on server boot
  try {
    executeAllTests();
    runBackendTests();
  } catch (err) {
    console.error("Failed to run QA validations:", err);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FIFA Pulse AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
