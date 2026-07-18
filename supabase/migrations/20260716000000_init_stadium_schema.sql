-- Supabase Migration: 20260716000000_init_stadium_schema.sql
-- Description: Production-grade schema design for FIFA Pulse AI NextGen.
-- Optimizations: Full indexing, row-level security (RLS), real-time pub/sub replication, cascade deletion safety.

-- ==========================================
-- 0. EXTENSIONS & CUSTOM TYPE DEFINITIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.user_role AS ENUM ('fan', 'volunteer', 'staff', 'organizer', 'admin');
CREATE TYPE public.incident_status AS ENUM ('active', 'resolved');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.incident_category AS ENUM ('crowd', 'medical', 'security', 'facility', 'weather');
CREATE TYPE public.alert_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.service_status AS ENUM ('operational', 'limited', 'disrupted');
CREATE TYPE public.transport_status AS ENUM ('smooth', 'delayed', 'congested', 'suspended');

-- ==========================================
-- 1. UTILITY FUNCTIONS (ModTime Trigger)
-- ==========================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. TABLE DEFINITIONS
-- ==========================================

-- Table 1: users (Extends auth.users, stores roles)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'fan',
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: profiles (Demographic data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: stadiums (Physical venues)
CREATE TABLE public.stadiums (
  id TEXT PRIMARY KEY, -- e.g., 'stadium-metlife', 'stadium-sofi'
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  latitude NUMERIC(10, 8) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(11, 8) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: stadium_metrics (Live spatial metrics)
CREATE TABLE public.stadium_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  attendance INTEGER NOT NULL DEFAULT 0 CHECK (attendance >= 0),
  crowd_density NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (crowd_density BETWEEN 0 AND 100),
  stadium_health_score INTEGER NOT NULL DEFAULT 100 CHECK (stadium_health_score BETWEEN 0 AND 100),
  gate_congestion JSONB NOT NULL DEFAULT '{}'::jsonb,
  resource_utilization JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: incidents (Security and safety issues)
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 3),
  description TEXT NOT NULL,
  status public.incident_status NOT NULL DEFAULT 'active',
  severity public.incident_severity NOT NULL DEFAULT 'medium',
  category public.incident_category NOT NULL DEFAULT 'crowd',
  location TEXT NOT NULL,
  reporter_name TEXT NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 6: simulations (Drill run history)
CREATE TABLE public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  scenario_type TEXT NOT NULL,
  intensity TEXT NOT NULL,
  findings TEXT NOT NULL,
  mitigation_plan TEXT NOT NULL,
  operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 7: ai_recommendations (Proactive operations recommendations)
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  insight TEXT NOT NULL,
  priority public.alert_priority NOT NULL DEFAULT 'medium',
  confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (confidence_score BETWEEN 0 AND 100),
  action_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_applied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 8: notifications (Operational warnings/alerts)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority public.alert_priority NOT NULL DEFAULT 'medium',
  type TEXT NOT NULL, -- e.g., 'incident', 'ai_directive'
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  escalation_workflow TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 9: accessibility_services (Concession, ramp, elevator statuses)
CREATE TABLE public.accessibility_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- e.g., 'elevator_1', 'wheelchair_ramp'
  status public.service_status NOT NULL DEFAULT 'operational',
  location_details TEXT NOT NULL,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 10: transport_updates (Live transit updates)
CREATE TABLE public.transport_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  route_or_zone TEXT NOT NULL,
  mode TEXT NOT NULL, -- e.g., 'rail', 'bus', 'shuttle'
  estimated_wait_minutes INTEGER NOT NULL DEFAULT 0 CHECK (estimated_wait_minutes >= 0),
  sustainability_score INTEGER NOT NULL DEFAULT 100 CHECK (sustainability_score BETWEEN 0 AND 100),
  status public.transport_status NOT NULL DEFAULT 'smooth',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 11: emergency_procedures (Procedures guidelines)
CREATE TABLE public.emergency_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  severity_level public.incident_severity NOT NULL DEFAULT 'high',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 12: crowd_alerts (Zonal crowd risks)
CREATE TABLE public.crowd_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  zone TEXT NOT NULL,
  risk_level public.alert_priority NOT NULL DEFAULT 'medium',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 13: operational_events (General log events)
CREATE TABLE public.operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id TEXT NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity public.alert_priority NOT NULL DEFAULT 'low',
  operator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. TRIGGER REGISTRATION FOR TIMESTAMP SYNC
-- ==========================================
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_stadiums_modtime BEFORE UPDATE ON public.stadiums FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_stadium_metrics_modtime BEFORE UPDATE ON public.stadium_metrics FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_incidents_modtime BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_ai_recs_modtime BEFORE UPDATE ON public.ai_recommendations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_accessibility_modtime BEFORE UPDATE ON public.accessibility_services FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_transport_modtime BEFORE UPDATE ON public.transport_updates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_emergency_modtime BEFORE UPDATE ON public.emergency_procedures FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_crowd_alerts_modtime BEFORE UPDATE ON public.crowd_alerts FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==========================================
-- 4. HIGH PERFORMANCE INDEXES
-- ==========================================
-- Query performance optimization for stadium and spatial data lookups
CREATE INDEX idx_metrics_stadium_id ON public.stadium_metrics(stadium_id);
CREATE INDEX idx_incidents_stadium_status ON public.incidents(stadium_id, status);
CREATE INDEX idx_incidents_severity ON public.incidents(severity);
CREATE INDEX idx_recs_stadium_applied ON public.ai_recommendations(stadium_id, is_applied);
CREATE INDEX idx_notifications_stadium_unread ON public.notifications(stadium_id, is_read);
CREATE INDEX idx_accessibility_stadium ON public.accessibility_services(stadium_id);
CREATE INDEX idx_transport_stadium_status ON public.transport_updates(stadium_id, status);
CREATE INDEX idx_crowd_alerts_stadium ON public.crowd_alerts(stadium_id);
CREATE INDEX idx_simulations_stadium ON public.simulations(stadium_id);
CREATE INDEX idx_opevents_stadium ON public.operational_events(stadium_id);

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stadiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stadium_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;

-- Helper security role checkers
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- --- User & Profile Table Policies ---
CREATE POLICY "Users profiles: Self-read and Admin management"
  ON public.users FOR SELECT USING (auth.uid() = id OR public.current_user_role() = 'admin');

CREATE POLICY "Users: Admin can manage all roles"
  ON public.users FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Profiles: Read access is public"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Profiles: Self-edit allowed"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- --- Stadium Read-Only for Public ---
CREATE POLICY "Stadiums: Read is open to all"
  ON public.stadiums FOR SELECT USING (true);

CREATE POLICY "Stadiums: Admin/Organizer write capability"
  ON public.stadiums FOR ALL USING (public.current_user_role() IN ('organizer', 'admin'));

-- --- Stadium Metrics Policies ---
CREATE POLICY "Metrics: Public read"
  ON public.stadium_metrics FOR SELECT USING (true);

CREATE POLICY "Metrics: Staff/Organizer/Admin write"
  ON public.stadium_metrics FOR ALL USING (public.current_user_role() IN ('staff', 'organizer', 'admin'));

-- --- Incidents Policies ---
CREATE POLICY "Incidents: Read-only access is open to all"
  ON public.incidents FOR SELECT USING (true);

CREATE POLICY "Incidents: Authorized logged-in users can report"
  ON public.incidents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Incidents: Staff/Organizer/Admin resolution edit"
  ON public.incidents FOR UPDATE USING (public.current_user_role() IN ('staff', 'organizer', 'admin'));

-- --- Simulation Drills Policies (Restricted to High-Level Roles) ---
CREATE POLICY "Simulations: Organizer and Admin exclusive access"
  ON public.simulations FOR ALL USING (public.current_user_role() IN ('organizer', 'admin'));

-- --- AI Recommendations Policies ---
CREATE POLICY "AI recommendations: Read-only for operational roles"
  ON public.ai_recommendations FOR SELECT USING (public.current_user_role() IN ('volunteer', 'staff', 'organizer', 'admin'));

CREATE POLICY "AI recommendations: System/Admin execution update"
  ON public.ai_recommendations FOR UPDATE USING (public.current_user_role() IN ('organizer', 'admin'));

-- --- Live Notifications / Alarms ---
CREATE POLICY "Notifications: Read access for everyone"
  ON public.notifications FOR SELECT USING (true);

CREATE POLICY "Notifications: Staff/Organizer/Admin can manage"
  ON public.notifications FOR ALL USING (public.current_user_role() IN ('staff', 'organizer', 'admin'));

-- --- Accessibility Services Policies ---
CREATE POLICY "Accessibility: Open read-only"
  ON public.accessibility_services FOR SELECT USING (true);

CREATE POLICY "Accessibility: Volunteer/Staff/Organizer/Admin status edit"
  ON public.accessibility_services FOR ALL USING (public.current_user_role() IN ('volunteer', 'staff', 'organizer', 'admin'));

-- --- Transport Updates Policies ---
CREATE POLICY "Transport: Public read access"
  ON public.transport_updates FOR SELECT USING (true);

CREATE POLICY "Transport: Volunteer/Staff/Organizer/Admin status edit"
  ON public.transport_updates FOR ALL USING (public.current_user_role() IN ('volunteer', 'staff', 'organizer', 'admin'));

-- --- Emergency Procedures Policies ---
CREATE POLICY "Emergency: Public read-only instructions"
  ON public.emergency_procedures FOR SELECT USING (true);

CREATE POLICY "Emergency: Organizer and Admin management"
  ON public.emergency_procedures FOR ALL USING (public.current_user_role() IN ('organizer', 'admin'));

-- --- Crowd Zonal Alerts ---
CREATE POLICY "Crowd Alerts: Public read access"
  ON public.crowd_alerts FOR SELECT USING (true);

CREATE POLICY "Crowd Alerts: Staff/Organizer/Admin management"
  ON public.crowd_alerts FOR ALL USING (public.current_user_role() IN ('staff', 'organizer', 'admin'));

-- --- Operational Event Logs ---
CREATE POLICY "Operational Events: Logged staff roles view only"
  ON public.operational_events FOR SELECT USING (public.current_user_role() IN ('staff', 'organizer', 'admin'));

CREATE POLICY "Operational Events: Logged staff roles can create logs"
  ON public.operational_events FOR INSERT WITH CHECK (public.current_user_role() IN ('staff', 'organizer', 'admin'));

-- ==========================================
-- 6. REALTIME SUBSCRIPTIONS PUBLICATION
-- ==========================================
-- Configures replication streams for real-time live synchronization of critical tables
begin;
  -- Drop existing publication if it exists
  drop publication if exists supabase_realtime;
  
  -- Create new publication for real-time tracking
  create publication supabase_realtime for table 
    public.stadium_metrics,
    public.incidents,
    public.notifications,
    public.crowd_alerts,
    public.transport_updates;
commit;
