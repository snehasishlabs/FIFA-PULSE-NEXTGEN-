import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Stadium, StadiumMetric, Incident, Simulation, AIRecommendation, Notification, AccessibilityService, TransportUpdate } from '../types';

export function useRealTimeData() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [activeStadiumId, setActiveStadiumId] = useState<string>("stadium-metlife");
  const [metrics, setMetrics] = useState<Record<string, StadiumMetric>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [accessibility, setAccessibility] = useState<AccessibilityService[]>([]);
  const [transport, setTransport] = useState<TransportUpdate[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // References to keep callbacks fresh without trigger loops
  const sseRef = useRef<EventSource | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        userRes,
        stadiumsRes,
        metricsRes,
        incidentsRes,
        simulationsRes,
        recsRes,
        notifRes,
        accRes,
        transRes
      ] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/stadiums'),
        fetch('/api/metrics'),
        fetch('/api/incidents'),
        fetch('/api/simulations'),
        fetch('/api/ai-assistant/recommendations'),
        fetch('/api/notifications'),
        fetch('/api/accessibility/services'),
        fetch('/api/transport')
      ]);

      if (!stadiumsRes.ok) throw new Error("Failed to load operations data");

      const userData = await userRes.json();
      const stadiumsData = await stadiumsRes.json();
      const metricsData = await metricsRes.json();
      const incidentsData = await incidentsRes.json();
      const simulationsData = await simulationsRes.json();
      const recsData = await recsRes.json();
      const notifData = await notifRes.json();
      const accData = await accRes.json();
      const transData = await transRes.json();

      setCurrentUser(userData.session?.user || null);
      setStadiums(stadiumsData.stadiums || stadiumsData.data?.stadiums || []);
      setMetrics(metricsData.metrics || metricsData.data?.metrics || {});
      setIncidents(incidentsData.incidents || incidentsData.data?.incidents || []);
      setSimulations(simulationsData.simulations || simulationsData.data?.simulations || []);
      setRecommendations(recsData.recommendations || recsData.data?.recommendations || []);
      setNotifications(notifData.notifications || notifData.data?.notifications || []);
      setAccessibility(accData.services || accData.data?.services || accData.data?.accessibility || []);
      setTransport(transData.transport || transData.data?.transport || []);

    } catch (err: unknown) {
      console.error("Initial data load error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to load real-time state.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect to Real-time State Event Stream (Supabase Realtime emulation)
  useEffect(() => {
    fetchInitialData();

    const connectSSE = () => {
      if (sseRef.current) sseRef.current.close();

      const sse = new EventSource('/api/realtime/stream');
      sseRef.current = sse;

      sse.onopen = () => {
        setIsConnected(true);
        console.log("Supabase Realtime Subscription active: Connected to FIFA Pulse Live Stream");
      };

      sse.onerror = () => {
        setIsConnected(false);
        console.warn("Real-time stream interrupted. Retrying connection...");
        setTimeout(connectSSE, 5000);
      };

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          switch (type) {
            case "INITIAL_HANDSHAKE":
              if (data.activeUser) {
                setCurrentUser(data.activeUser);
              }
              break;
            case "AUTH_UPDATE":
              setCurrentUser(data);
              break;
            case "METRICS_UPDATE":
              setMetrics(data);
              break;
            case "INCIDENT_ADDED":
              setIncidents(prev => [data.incident, ...prev]);
              setNotifications(prev => [data.notification, ...prev]);
              break;
            case "INCIDENT_RESOLVED":
              setIncidents(prev => prev.map(inc => inc.id === data.id ? data : inc));
              break;
            case "SIMULATION_RUN":
              if (data.simulation) {
                setSimulations(prev => [data.simulation, ...prev]);
              }
              if (data.incident) {
                setIncidents(prev => [data.incident, ...prev]);
              }
              if (data.notification) {
                setNotifications(prev => [data.notification, ...prev]);
              }
              if (data.metrics) {
                setMetrics(data.metrics);
              }
              break;
            case "RECOMMENDATION_APPLIED":
              setRecommendations(prev => prev.map(r => r.id === data.recommendation.id ? data.recommendation : r));
              setNotifications(prev => [data.notification, ...prev]);
              if (data.metrics) {
                setMetrics(data.metrics);
              }
              break;
            case "NOTIFICATION_READ":
              setNotifications(prev => prev.map(n => n.id === data.id ? data : n));
              break;
            case "NOTIFICATIONS_CLEARED":
              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              break;
            default:
              break;
          }
        } catch (err) {
          console.error("Error parsing live stream message:", err);
        }
      };
    };

    connectSSE();

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [fetchInitialData]);

  // Actions
  const changeRole = useCallback(async (role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan', name: string) => {
    try {
      const res = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, name })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Failed to update active role", err);
    }
  }, []);

  const reportIncident = useCallback(async (incidentData: Omit<Incident, 'id' | 'timestamp' | 'status' | 'escalationLevel'>) => {
    try {
      const res = await fetch('/api/incidents/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to report incident", err);
      return false;
    }
  }, []);

  const resolveIncident = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/incidents/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to resolve incident", err);
      return false;
    }
  }, []);

  const runSimulation = useCallback(async (simulationData: { stadiumId: string; scenarioType: string; intensity: string }) => {
    try {
      const res = await fetch('/api/simulations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationData)
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to run simulation", err);
      return false;
    }
  }, []);

  const applyRecommendation = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/ai-assistant/recommendations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to apply recommendation", err);
      return false;
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to mark notification read", err);
      return false;
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/clear', {
        method: 'POST'
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to clear notifications", err);
      return false;
    }
  }, []);

  const activeStadium = useMemo(() => {
    return stadiums.find(s => s.id === activeStadiumId) || stadiums[0];
  }, [stadiums, activeStadiumId]);

  const activeMetrics = useMemo(() => {
    return metrics[activeStadiumId] || null;
  }, [metrics, activeStadiumId]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => i.stadiumId === activeStadiumId);
  }, [incidents, activeStadiumId]);

  const filteredSimulations = useMemo(() => {
    return simulations.filter(s => s.stadiumId === activeStadiumId);
  }, [simulations, activeStadiumId]);

  const filteredAccessibility = useMemo(() => {
    return accessibility.filter(a => a.stadiumId === activeStadiumId);
  }, [accessibility, activeStadiumId]);

  const filteredTransport = useMemo(() => {
    return transport.filter(t => t.stadiumId === activeStadiumId);
  }, [transport, activeStadiumId]);

  return {
    stadiums,
    activeStadiumId,
    setActiveStadiumId,
    activeStadium,
    metrics: activeMetrics,
    incidents: filteredIncidents,
    allIncidents: incidents,
    simulations: filteredSimulations,
    recommendations,
    notifications,
    accessibility: filteredAccessibility,
    transport: filteredTransport,
    currentUser,
    isConnected,
    loading,
    error,
    changeRole,
    reportIncident,
    resolveIncident,
    runSimulation,
    applyRecommendation,
    markNotificationRead,
    clearAllNotifications,
    refetch: fetchInitialData
  };
}
