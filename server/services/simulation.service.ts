import { getSupabaseAdmin } from '../lib/supabase';
import { generateAIText } from '../lib/gemini';
import { Simulation } from '../types';
import { StadiumService } from './stadium.service';

const fallbackSimulations: Simulation[] = [
  {
    id: "sim-1",
    stadiumId: "stadium-metlife",
    scenarioType: "Crowd Surge",
    intensity: "high",
    findings: "Gate A experienced severe queue buildup. Spectators bottlenecked at primary security checkpoints. Process delay reached 8 minutes per spectator.",
    mitigationPlan: "Deploy supplemental volunteers to distribute spec-guide handouts. Open secondary metal detectors in Sector 2.",
    operatorId: "user-123",
    createdAt: new Date()
  }
];

interface DbSimulation {
  id: string;
  stadium_id: string;
  scenario_type: string;
  intensity: string;
  findings: string;
  mitigation_plan: string;
  operator_id?: string | null;
  created_at: string;
}

export class SimulationService {
  /**
   * Runs a simulated match day scenario.
   * Generates intelligent, stadium-specific drill outcomes using Gemini AI,
   * then archives the run logs in the database.
   */
  static async runSimulation(stadiumId: string, scenarioType: string, intensity: 'low' | 'medium' | 'high' | 'critical', operatorId?: string): Promise<Simulation> {
    const stadium = await StadiumService.getStadiumById(stadiumId);
    if (!stadium) {
      throw new Error(`Stadium with ID ${stadiumId} not found.`);
    }

    const contextPrompt = `
      You are the Simulation Director for FIFA Pulse NextGen.
      Conduct a dry-run operational drill simulation at ${stadium.name} in ${stadium.city}.
      
      Simulation Parameters:
      - Scenario Type: ${scenarioType}
      - Drill Intensity: ${intensity}
      - Stadium Capacity: ${stadium.capacity}

      Develop:
      1. Findings: A highly specific paragraph of observations, bottlenecks, or queue-clearing delays discovered.
      2. Mitigation Plan: A structured set of venue steward directives, perimeter re-routing, or staff redeployments.

      Return the result strictly as a JSON object matching this schema:
      {
        "findings": "Detailed observations paragraph.",
        "mitigationPlan": "Coordinated action items list or detailed strategy paragraph."
      }
    `;

    const systemInstruction = "You are a senior crisis manager and logistics expert. Be realistic and critical of security delays. Return ONLY JSON.";

    let findings = "Drill run successfully. Local staff responded to perimeter checkpoints according to standard SOP.";
    let mitigationPlan = "Ensure local security volunteers maintain clear line-of-sight across transit zones.";

    try {
      const aiResponse = await generateAIText(contextPrompt, systemInstruction, "application/json");
      const parsed = JSON.parse(aiResponse);
      if (parsed.findings) findings = parsed.findings;
      if (parsed.mitigationPlan) mitigationPlan = parsed.mitigationPlan;
    } catch (err) {
      console.warn("AI simulation run generation failed, falling back to static drill generator:", err);
      if (scenarioType.toLowerCase().includes("weather")) {
        findings = `Severe thunderstorm simulation at ${stadium.name}. Spectators from open tiers retreated to concourses. Concourse density surged to critical levels near gates A & B.`;
        mitigationPlan = `Activate indoor entertainment screens to distribute crowd pressure. Hold exit gates until heavy downpour subsides.`;
      } else if (scenarioType.toLowerCase().includes("evacuation")) {
        findings = `Emergency fire-alarm evacuation test in Sector 3. Lower bowl cleared in 6.4 minutes. Main stairwell bottleneck detected near Concourse Gate C.`;
        mitigationPlan = `Stagger egress calls by row groups. Place dedicated fire marshals at Concourse Gate C junction.`;
      } else {
        findings = `Simulated spectator entry surge during peak pre-match window at ${stadium.name}. Digital ticket scanners experienced minor intermittent latency. Entry queues stretched beyond perimeter barriers.`;
        mitigationPlan = `Transition scanners to local cached mode. Set up visual lane-dividers 50 meters back to organize Spectator ingress flow.`;
      }
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const insertPayload = {
          stadium_id: stadiumId,
          scenario_type: scenarioType,
          intensity,
          findings,
          mitigation_plan: mitigationPlan,
          operator_id: operatorId
        };

        const { data, error } = await (supabase
          .from('simulations')
          .insert(insertPayload as unknown as never)
          .select()
          .single() as unknown as Promise<{ data: DbSimulation | null; error: any }>);

        if (!error && data) {
          return {
            id: data.id,
            stadiumId: data.stadium_id,
            scenarioType: data.scenario_type,
            intensity: data.intensity as any,
            findings: data.findings,
            mitigationPlan: data.mitigation_plan,
            operatorId: data.operator_id || undefined,
            createdAt: new Date(data.created_at)
          };
        }
      } catch (dbErr) {
        console.error("Failed to insert simulation into Supabase:", dbErr);
      }
    }

    // In-memory / fallback return
    const fallbackSim: Simulation = {
      id: `sim-${Math.random().toString(36).substr(2, 9)}`,
      stadiumId,
      scenarioType,
      intensity,
      findings,
      mitigationPlan,
      operatorId,
      createdAt: new Date()
    };
    fallbackSimulations.unshift(fallbackSim);
    return fallbackSim;
  }

  /**
   * Retrieves the historical drill log list.
   */
  static async getSimulationHistory(stadiumId?: string, limit = 20, offset = 0): Promise<{ simulations: Simulation[]; total: number }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      let filtered = fallbackSimulations;
      if (stadiumId) filtered = filtered.filter(s => s.stadiumId === stadiumId);
      return { simulations: filtered.slice(offset, offset + limit), total: filtered.length };
    }

    try {
      let query = supabase
        .from('simulations')
        .select('*', { count: 'exact' });

      if (stadiumId) {
        query = query.eq('stadium_id', stadiumId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !data) {
        return { simulations: [], total: 0 };
      }

      const simulations: Simulation[] = (data as any[]).map(s => ({
        id: s.id,
        stadiumId: s.stadium_id,
        scenarioType: s.scenario_type,
        intensity: s.intensity as any,
        findings: s.findings,
        mitigationPlan: s.mitigation_plan,
        operatorId: s.operator_id,
        createdAt: new Date(s.created_at)
      }));

      return { simulations, total: count || simulations.length };
    } catch {
      return { simulations: [], total: 0 };
    }
  }

  /**
   * Fetches detailed specs of a single past simulation.
   */
  static async getSimulationById(id: string): Promise<Simulation | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return fallbackSimulations.find(s => s.id === id) || null;
    }

    try {
      const { data, error } = await (supabase
        .from('simulations')
        .select('*')
        .eq('id', id)
        .single() as unknown as Promise<{ data: DbSimulation | null; error: any }>);

      if (error || !data) {
        return fallbackSimulations.find(s => s.id === id) || null;
      }

      return {
        id: data.id,
        stadiumId: data.stadium_id,
        scenarioType: data.scenario_type,
        intensity: data.intensity as any,
        findings: data.findings,
        mitigationPlan: data.mitigation_plan,
        operatorId: data.operator_id || undefined,
        createdAt: new Date(data.created_at)
      };
    } catch {
      return fallbackSimulations.find(s => s.id === id) || null;
    }
  }
}
