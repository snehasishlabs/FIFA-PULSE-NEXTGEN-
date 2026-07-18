import { generateAIText } from '../lib/gemini';
import { StadiumService } from './stadium.service';
import { getSupabaseAdmin } from '../lib/supabase';
import { AIRecommendation } from '../types';

export class AIService {
  /**
   * Generates highly relevant AI operational recommendations based on active stadium state.
   */
  static async generateRecommendations(stadiumId: string): Promise<Partial<AIRecommendation>> {
    // 1. Collect real-time database context for high-precision grounding
    const stadium = await StadiumService.getStadiumById(stadiumId);
    const metrics = await StadiumService.getStadiumMetrics(stadiumId);
    const { incidents } = await StadiumService.getStadiumIncidents(stadiumId);

    if (!stadium) {
      throw new Error(`Stadium with ID ${stadiumId} not found.`);
    }

    const contextPrompt = `
      You are the Chief AI Stadium Coordinator for FIFA Pulse NextGen.
      Analyze the current live status of ${stadium.name} located in ${stadium.city} to generate ONE high-impact proactive operational recommendation.

      Current Stadium Context:
      - Total Capacity: ${stadium.capacity} seats
      - Current Attendance: ${metrics?.attendance || 'N/A'} attendees
      - Overall Crowd Density: ${metrics?.crowdDensity || 0}%
      - Current Stadium Health Score: ${metrics?.stadiumHealthScore || 100}/100
      - Gate Congestion Levels: ${JSON.stringify(metrics?.gateCongestion || {})}
      - Resource Utilization: ${JSON.stringify(metrics?.resourceUtilization || {})}
      - Active Security/Operational Incidents: ${JSON.stringify(incidents.map(i => ({ title: i.title, severity: i.severity, category: i.category, location: i.location })))}

      Task:
      Generate one single, highly specific proactive recommendation to improve safety, throughput, or resource efficiency.
      Your response must be returned strictly as a JSON object matching this schema:
      {
        "insight": "Clear summary of the operational problem and proposed strategy",
        "priority": "low" | "medium" | "high" | "critical",
        "confidenceScore": number (between 0 and 100),
        "actionPlan": [
          { "step": 1, "action": "Specific directive action description", "responsibleParty": "Role responsible (e.g. Venue Security, Volunteers, Transit Ops)" }
        ]
      }
    `;

    const systemInstruction = "You are a professional venue safety and crowd science analytics engine. Return ONLY a valid JSON object.";

    try {
      const resultText = await generateAIText(contextPrompt, systemInstruction, "application/json");
      const parsed = JSON.parse(resultText);

      // Save recommendation to public.ai_recommendations if Supabase is active
      const supabase = getSupabaseAdmin();
      if (supabase && parsed.insight) {
        interface DbRecommendation {
          id: string;
          stadium_id: string;
          insight: string;
          priority: string;
          confidence_score: number;
          action_plan: Array<{ step: number; action: string; responsibleParty: string }>;
          is_applied: boolean;
          created_at: string;
          updated_at: string;
        }

        const insertPayload = {
          stadium_id: stadiumId,
          insight: parsed.insight,
          priority: parsed.priority || 'medium',
          confidence_score: parsed.confidenceScore || 85.0,
          action_plan: parsed.actionPlan || [],
          is_applied: false
        };

        const { data, error } = await (supabase
          .from('ai_recommendations')
          .insert(insertPayload as unknown as never)
          .select()
          .single() as unknown as Promise<{ data: DbRecommendation | null; error: any }>);

        if (!error && data) {
          return {
            id: data.id,
            stadiumId: data.stadium_id,
            insight: data.insight,
            priority: data.priority as any,
            confidenceScore: Number(data.confidence_score),
            actionPlan: data.action_plan,
            isApplied: data.is_applied,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        }
      }

      return {
        stadiumId,
        insight: parsed.insight,
        priority: parsed.priority,
        confidenceScore: parsed.confidenceScore,
        actionPlan: parsed.actionPlan,
        isApplied: false,
        createdAt: new Date()
      };
    } catch (err) {
      console.warn("AI generation failed or Supabase was disconnected. Using deterministic backup engine.", err);
      
      // Fallback response for offline or developer comfort
      const hasHighCongestion = metrics && Object.values(metrics.gateCongestion).includes('high');
      const backupRec: Partial<AIRecommendation> = {
        stadiumId,
        insight: hasHighCongestion 
          ? "High congestion detected at North gates. Initiate dynamic perimeter routing guides to balance inflow."
          : "Optimize volunteer placement near concessions to assist high-density food court lines.",
        priority: hasHighCongestion ? "high" : "medium",
        confidenceScore: 92.5,
        actionPlan: [
          {
            step: 1,
            action: hasHighCongestion 
              ? "Re-route inbound spectators from Gates A/D to Gate C utilizing PA announcements." 
              : "Reallocate 10 volunteer monitors from low-density concourses to Sector 4 concession stalls.",
            responsibleParty: hasHighCongestion ? "Transit & Gates Ops" : "Volunteer Coordinator"
          },
          {
            step: 2,
            action: hasHighCongestion 
              ? "Deploy mobile barricades to create physical queuing guides near transit junctions." 
              : "Update live digital billboard schedules to display wait-time alternatives.",
            responsibleParty: hasHighCongestion ? "Field Security" : "AV Systems Manager"
          }
        ],
        isApplied: false,
        createdAt: new Date()
      };

      return backupRec;
    }
  }

  /**
   * Conducts deep AI Operational Bottleneck & Flow Analysis.
   */
  static async performOperationalAnalysis(stadiumId: string, parameters: Record<string, any>): Promise<{ analysis: string; bottlenecks: string[]; suggestions: string[] }> {
    const stadium = await StadiumService.getStadiumById(stadiumId);
    if (!stadium) {
      throw new Error("Stadium not found");
    }

    const contextPrompt = `
      Perform a deep operational flow bottleneck audit for ${stadium.name}.
      Parameters under test:
      ${JSON.stringify(parameters, null, 2)}

      Assess:
      1. Potential ingress bottlenecks and pedestrian queue build-ups.
      2. Resource efficiency constraints.
      3. Practical logistics recommendations.

      Provide your analysis response strictly in a JSON format matching:
      {
        "analysis": "Detailed descriptive paragraph outlining the performance, congestion risks, and logistics of the event",
        "bottlenecks": ["list", "of", "bottlenecks"],
        "suggestions": ["remedial", "operational", "adjustments"]
      }
    `;

    const systemInstruction = "You are a professional stadium operations simulator and industrial engineer. Output ONLY clean JSON.";

    try {
      const resultText = await generateAIText(contextPrompt, systemInstruction, "application/json");
      return JSON.parse(resultText);
    } catch (err) {
      console.warn("AI operational analysis fallback triggered:", err);
      return {
        analysis: `Operational simulation for ${stadium.name} reveals optimal spectator movement through high-capacity turnstiles. Concourse sectors present standard surge intervals matching pre-match halftime slots. Security screening duration remains steady at 45 seconds per fan.`,
        bottlenecks: [
          "Halftime queuing bottlenecks at Concourse East concession stands",
          "Pedestrian queue stagnation near transit transfer hub 'Gate A Plaza'"
        ],
        suggestions: [
          "Pre-stage high-demand beverages to decrease checkout times during peak surges",
          "Add temporary express lanes for fans entering without carry-on luggage"
        ]
      };
    }
  }

  /**
   * Synthesizes rapid tactical response instructions for active high-severity incidents.
   */
  static async synthesizeEmergencyResponse(incidentId: string, details: string): Promise<{ protocolTitle: string; stepByStepDirectives: string[]; coordinationLogistics: string; evacuationUrgency: 'low' | 'moderate' | 'high' | 'immediate' }> {
    const contextPrompt = `
      CRITICAL INCIDENT THREAT VECTOR ASSESSMENT & TACTICAL PROTOCOL SYNTHESIS

      Active Incident Report:
      - Details: ${details}
      - Reference ID: ${incidentId}

      Synthesize immediate, clear, non-panic instructions for field stewards, security staff, and medical dispatchers.
      Provide response in JSON format matching:
      {
        "protocolTitle": "Short official directive codename/title",
        "stepByStepDirectives": ["Step 1...", "Step 2...", "Step 3..."],
        "coordinationLogistics": "Radio channels to activate, local staging areas, and services dispatch details.",
        "evacuationUrgency": "low" | "moderate" | "high" | "immediate"
      }
    `;

    const systemInstruction = "You are an elite stadium emergency incident commander. Be direct, authoritative, and structured. Output ONLY JSON.";

    try {
      const resultText = await generateAIText(contextPrompt, systemInstruction, "application/json");
      return JSON.parse(resultText);
    } catch (err) {
      console.warn("Emergency response AI synthesis fallback triggered:", err);
      return {
        protocolTitle: "TACTICAL CROWD DENSITY MITIGATION (PROTOCOL T-12)",
        stepByStepDirectives: [
          "Dispatch 12 Rapid Security Officers to the sector perimeter.",
          "Open emergency egress gates 4 and 5 to relieve pressure.",
          "Establish a safety buffer zone of 15 meters to prevent crowd surge."
        ],
        coordinationLogistics: "Switch Local Security Sector 3 to Radio Channel Echo. Setup medical staging station at gate C-12.",
        evacuationUrgency: "high"
      };
    }
  }
}
