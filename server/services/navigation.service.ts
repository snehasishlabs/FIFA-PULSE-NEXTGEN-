import { generateAIText } from '../lib/gemini';
import { StadiumService } from './stadium.service';
import { AccessibilityServiceClass } from './accessibility.service';
import { TransportService } from './transport.service';

export interface LatLngLiteral {
  lat: number;
  lng: number;
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
  pathCoordinates: LatLngLiteral[];
  steps: NavigationStep[];
  alternatives: NavigationAlternative[];
}

export class NavigationService {
  /**
   * Generates an optimal navigation plan based on real-time congestion, active incidents, accessibility setting, and language.
   */
  static async computeOptimalRoute(
    stadiumId: string,
    originKey: string, // e.g. "transit_metro", "parking_lot_c", "parking_lot_g"
    destinationKey: string, // e.g. "gate_a", "gate_b", "gate_c"
    routeType: 'standard' | 'crowd_avoidance' | 'accessible' | 'family' | 'evacuation',
    language: 'en' | 'es' | 'pt' | 'fr'
  ): Promise<NavigationRoutePlan> {
    
    // 1. Fetch real-time grounds telemetry
    const stadium = await StadiumService.getStadiumById(stadiumId);
    if (!stadium) {
      throw new Error(`Stadium with ID ${stadiumId} not found.`);
    }

    const metrics = await StadiumService.getStadiumMetrics(stadiumId);
    const { incidents } = await StadiumService.getStadiumIncidents(stadiumId);
    const accessibilityServices = await AccessibilityServiceClass.getServicesByStadium(stadiumId);
    const transportUpdates = await TransportService.getTransportByStadium(stadiumId);

    // 2. Resolve default baseline geographical coords to center near the venue
    const baseLat = stadium.latitude;
    const baseLng = stadium.longitude;

    // Build baseline coordinate paths dynamically around stadium center depending on origin/destination options
    // This ensures beautiful spatial visualization on Google Maps
    const pathCoordinates: LatLngLiteral[] = [];
    let startLat = baseLat;
    let startLng = baseLng;
    let midLat = baseLat;
    let midLng = baseLng;
    const endLat = baseLat;
    const endLng = baseLng;

    // Establish coordinate jitter relative to stadium depending on selection
    if (originKey.includes('transit') || originKey.includes('station')) {
      startLat = baseLat + 0.0020;
      startLng = baseLng + 0.0020;
    } else if (originKey.includes('lot_c') || originKey.includes('parking_c')) {
      startLat = baseLat - 0.0030;
      startLng = baseLng - 0.0015;
    } else { // general/parking_g
      startLat = baseLat + 0.0010;
      startLng = baseLng - 0.0025;
    }

    if (destinationKey.includes('gate_a') || destinationKey.includes('entrance_1')) {
      midLat = baseLat + 0.0010;
      midLng = baseLng + 0.0010;
    } else if (destinationKey.includes('gate_b') || destinationKey.includes('entrance_2')) {
      midLat = baseLat;
      midLng = baseLng + 0.0015;
    } else {
      midLat = baseLat - 0.0010;
      midLng = baseLng - 0.0010;
    }

    // Standard multi-point path
    pathCoordinates.push({ lat: startLat, lng: startLng });
    pathCoordinates.push({ lat: (startLat + midLat) / 2, lng: (startLng + midLng) / 2 });
    pathCoordinates.push({ lat: midLat, lng: midLng });
    pathCoordinates.push({ lat: (midLat + endLat) / 2, lng: (midLng + endLng) / 2 });
    pathCoordinates.push({ lat: endLat, lng: endLng });

    // 3. Construct prompt for Gemini
    const contextPrompt = `
      You are the elite FIFA Pulse AI Spatial Routing Assistant.
      You are calculating a route plan within ${stadium.name} in ${stadium.city}.

      ROUTE SPECIFICATIONS:
      - Origin: ${originKey.toUpperCase().replace('_', ' ')}
      - Destination: ${destinationKey.toUpperCase().replace('_', ' ')}
      - Routing Mode: ${routeType.toUpperCase()} (options are: standard, crowd_avoidance, accessible, family, evacuation)
      - Preferred Output Language: ${language.toUpperCase()} (options are: en, es, pt, fr)

      CURRENT VENUE TELEMETRY:
      - Crowd Density: ${metrics?.crowdDensity || 0}%
      - Gate Congestion levels: ${JSON.stringify(metrics?.gateCongestion || {})}
      - Active Security & Facility Incidents: ${JSON.stringify(incidents.map(i => ({ title: i.title, severity: i.severity, location: i.location, description: i.description })))}
      - Accessibility Elevator/Escort statuses: ${JSON.stringify(accessibilityServices.map(a => ({ type: a.serviceType, status: a.status, location: a.locationDetails })))}
      - Public Transport operations: ${JSON.stringify(transportUpdates.map(t => ({ mode: t.mode, zone: t.routeOrZone, status: t.status, wait: t.estimatedWaitMinutes })))}

      DIRECTIONS & ROUTING OBJECTIVES:
      1. For CROWD_AVOIDANCE: Suggest paths that avoid gates marked 'high' congestion, bypass reported crowd incidents, or route around active security bottlenecks.
      2. For ACCESSIBLE: Recommend step-by-step instructions that strictly specify step-free routes, indicate active elevators, and use operational shuttle services. Warn the user if there are disrupted elevators or blocked wheelchair ramps on their path (e.g. check the active incidents).
      3. For FAMILY: Recommend paths with gentle slopes, diaper-changing access points, and low-density bypass channels.
      4. For EVACUATION: Generate emergency escape directions that point to the nearest safe emergency exit gates.
      5. Translate all textual descriptions, warnings, steps instructions, and route explanations fully into the preferred language (${language}).

      RESPONSE FORMAT:
      Your response must be returned strictly as a JSON object matching this schema:
      {
        "routeExplanation": "Concise paragraph in ${language} explaining the selected route's benefits, congestion bypass, and convenience.",
        "totalDistanceMeters": number (suggest something between 250 and 1200 depending on path),
        "estimatedDurationMinutes": number,
        "routeDensityLevel": "low" | "medium" | "high",
        "accessibilityRating": "optimal" | "limited" | "not_recommended",
        "warnings": ["Array of localized warnings in ${language} if applicable (e.g., active elevator outage, heavy congestion at Gate A)"],
        "steps": [
          { "instruction": "Step 1 text in ${language}", "distanceMeters": number, "durationSeconds": number },
          { "instruction": "Step 2 text in ${language}", "distanceMeters": number, "durationSeconds": number }
        ],
        "alternatives": [
          {
            "name": "Alternative route name in ${language}",
            "routeExplanation": "Why this alternative is safe and fast in ${language}",
            "steps": ["Step 1 description in ${language}", "Step 2 description in ${language}"]
          }
        ]
      }
    `;

    const systemInstruction = `You are a professional geospatial routing advisor and transit safety engine for the FIFA World Cup 2026. You speak fluent English, Spanish, Portuguese, and French. Return ONLY a valid JSON object. Do not enclose it in any markdown backticks.`;

    try {
      const resultText = await generateAIText(contextPrompt, systemInstruction, "application/json");
      const parsed = JSON.parse(resultText);

      return {
        routeExplanation: parsed.routeExplanation,
        totalDistanceMeters: parsed.totalDistanceMeters || 650,
        estimatedDurationMinutes: parsed.estimatedDurationMinutes || 8,
        routeDensityLevel: parsed.routeDensityLevel || 'low',
        accessibilityRating: parsed.accessibilityRating || 'optimal',
        warnings: parsed.warnings || [],
        pathCoordinates,
        steps: parsed.steps || [],
        alternatives: parsed.alternatives || []
      };
    } catch (err) {
      console.warn("Gemini navigation generation failed, running deterministic localized translation fallback.", err);

      // Deterministic localization fallbacks for full offline capabilities
      const translations: Record<string, Record<string, any>> = {
        en: {
          exp: `Standard navigation path generated from ${originKey.replace('_', ' ')} to ${destinationKey.replace('_', ' ')}. Standard transit speed applied.`,
          steps: [
            { instruction: "Depart from transit hub station platform.", distanceMeters: 150, durationSeconds: 120 },
            { instruction: "Proceed forward along the custom walkway corridor.", distanceMeters: 200, durationSeconds: 180 },
            { instruction: "Check in with volunteer hosts at the outer stadium security gate.", distanceMeters: 100, durationSeconds: 90 }
          ],
          warn: incidents.length > 0 ? [`Live Incident Warning: ${incidents[0].title} reported at ${incidents[0].location}.`] : [],
          alt_name: "Alternative Concourse Bypass",
          alt_exp: "Evade standard pathway to utilize a secondary external concourse loop."
        },
        es: {
          exp: `Ruta de navegación estándar generada desde ${originKey.replace('_', ' ')} hasta ${destinationKey.replace('_', ' ')}. Velocidad estándar de tránsito aplicada.`,
          steps: [
            { instruction: "Salga de la plataforma de la estación del centro de tránsito.", distanceMeters: 150, durationSeconds: 120 },
            { instruction: "Avance por el pasillo de paso peatonal personalizado.", distanceMeters: 200, durationSeconds: 180 },
            { instruction: "Regístrese con los voluntarios en la puerta de seguridad exterior.", distanceMeters: 100, durationSeconds: 90 }
          ],
          warn: incidents.length > 0 ? [`Advertencia de incidente activo: ${incidents[0].title} reportado en ${incidents[0].location}.`] : [],
          alt_name: "Bypass de Pasillo Alternativo",
          alt_exp: "Evite el camino principal utilizando un circuito concéntrico externo secundario."
        },
        pt: {
          exp: `Caminho de navegação padrão gerado de ${originKey.replace('_', ' ')} para ${destinationKey.replace('_', ' ')}. Velocidade de trânsito normal aplicada.`,
          steps: [
            { instruction: "Parta da plataforma da estação de trânsito integrada.", distanceMeters: 150, durationSeconds: 120 },
            { instruction: "Siga em frente ao longo do corredor pedonal sinalizado.", distanceMeters: 200, durationSeconds: 180 },
            { instruction: "Apresente sua credencial aos voluntários no portão externo.", distanceMeters: 100, durationSeconds: 90 }
          ],
          warn: incidents.length > 0 ? [`Aviso de Incidente Ativo: ${incidents[0].title} reportado em ${incidents[0].location}.`] : [],
          alt_name: "Desvio do Corredor Externo",
          alt_exp: "Evite o fluxo central utilizando o anel externo alternativo."
        },
        fr: {
          exp: `Itinéraire de navigation standard généré de ${originKey.replace('_', ' ')} vers ${destinationKey.replace('_', ' ')}. Vitesse de marche standard appliquée.`,
          steps: [
            { instruction: "Quittez la plateforme de la station de transport.", distanceMeters: 150, durationSeconds: 120 },
            { instruction: "Avancez le long du couloir piétonnier balisé.", distanceMeters: 200, durationSeconds: 180 },
            { instruction: "Présentez votre billet aux volontaires à la porte de sécurité.", distanceMeters: 100, durationSeconds: 90 }
          ],
          warn: incidents.length > 0 ? [`Alerte Incident : ${incidents[0].title} signalé à ${incidents[0].location}.`] : [],
          alt_name: "Déviation par l'Allée Secondaire",
          alt_exp: "Évitez l'axe principal en contournant par la coursive extérieure."
        }
      };

      const langSet = translations[language] || translations.en;
      
      return {
        routeExplanation: langSet.exp,
        totalDistanceMeters: 450,
        estimatedDurationMinutes: 6,
        routeDensityLevel: metrics?.crowdDensity && metrics.crowdDensity > 75 ? 'high' : 'medium',
        accessibilityRating: routeType === 'accessible' ? 'optimal' : 'limited',
        warnings: langSet.warn,
        pathCoordinates,
        steps: langSet.steps,
        alternatives: [
          {
            name: langSet.alt_name,
            routeExplanation: langSet.alt_exp,
            steps: langSet.steps.map((s: any) => s.instruction)
          }
        ]
      };
    }
  }

  /**
   * Conversational route advisor chat for real-time question answering about stadium pathways.
   */
  static async askRouteAdvisor(
    stadiumId: string,
    message: string,
    language: 'en' | 'es' | 'pt' | 'fr'
  ): Promise<string> {
    const stadium = await StadiumService.getStadiumById(stadiumId);
    if (!stadium) {
      throw new Error(`Stadium with ID ${stadiumId} not found.`);
    }

    const metrics = await StadiumService.getStadiumMetrics(stadiumId);
    const { incidents } = await StadiumService.getStadiumIncidents(stadiumId);
    const transportUpdates = await TransportService.getTransportByStadium(stadiumId);

    const contextPrompt = `
      You are the friendly, expert FIFA Pulse AI Route Advisor.
      The user is asking a question about getting around inside or outside ${stadium.name} in ${stadium.city}.
      
      CURRENT TELEMETRY FOR REFERENCE:
      - Overall Crowd Density: ${metrics?.crowdDensity || 0}%
      - Gate Congestions: ${JSON.stringify(metrics?.gateCongestion || {})}
      - Active Incidents: ${JSON.stringify(incidents.map(i => ({ title: i.title, severity: i.severity, location: i.location })))}
      - Public Transport status: ${JSON.stringify(transportUpdates.map(t => ({ mode: t.mode, status: t.status, wait: t.estimatedWaitMinutes })))}

      USER QUESTION: "${message}"

      Please write a friendly, concise, and highly useful response in ${language.toUpperCase()}.
      - Provide practical, real-world advice tailored to their question.
      - Take the live telemetry (crowd congestion, transit wait times, active incidents) directly into consideration.
      - Keep explanations simple, jargon-free, and action-oriented. Use scannable bullet points for clarity.
    `;

    const systemInstruction = `You are a helpful and polite stadium travel concierge. Keep responses brief, direct, and under 150 words. Support the language preferred: ${language}.`;

    try {
      return await generateAIText(contextPrompt, systemInstruction);
    } catch (err) {
      console.warn("AI Route advisor fallback triggered:", err);
      
      const backupReplies: Record<string, string> = {
        en: `I am currently operating in standalone backup mode. Telemetry shows **${metrics?.crowdDensity || 65}% overall crowd density**. Gate A is showing heavy transit queues. I suggest walking towards Gates B or C for faster access, and utilizing the Meadowlands Line with a current 25-minute wait time.`,
        es: `Actualmente estoy operando en modo de respaldo fuera de línea. La telemetría muestra un **${metrics?.crowdDensity || 65}% de densidad de multitudes**. La Puerta A tiene colas de tránsito pesadas. Recomiendo caminar hacia las Puertas B o C para un acceso más rápido y usar el tren de conexión.`,
        pt: `Estou operando em modo de segurança simplificado. A densidade de público é de **${metrics?.crowdDensity || 65}%**. O Portão A está congestionado. Sugiro seguir para os Portões B ou C para maior agilidade, e utilizar o metrô integrado de trânsito.`,
        fr: `Je fonctionne actuellement en mode de secours autonome. La densité de foule globale est de **${metrics?.crowdDensity || 65}%**. La Porte A présente des files d'attente importantes. Je vous conseille de vous diriger vers les Portes B ou C pour un accès plus rapide.`
      };

      return backupReplies[language] || backupReplies.en;
    }
  }
}
