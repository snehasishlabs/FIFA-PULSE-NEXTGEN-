-- FIFA Pulse AI NextGen Database Schema
-- Normalized PostgreSQL schema designed for high-performance and Row Level Security (RLS)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operations', 'venue_staff', 'volunteer', 'fan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Stadiums table
CREATE TABLE IF NOT EXISTS public.stadiums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  city VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Stadium Metrics table
CREATE TABLE IF NOT EXISTS public.stadium_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  attendance INTEGER NOT NULL CHECK (attendance >= 0),
  crowd_density DECIMAL(5, 2) NOT NULL CHECK (crowd_density >= 0.00 AND crowd_density <= 100.00),
  gate_congestion JSONB NOT NULL, -- Gate statuses e.g., {"gate_a": "low", "gate_b": "high"}
  resource_utilization JSONB NOT NULL, -- E.g. {"security": 75, "medical": 40, "concessions": 85}
  stadium_health_score INTEGER NOT NULL CHECK (stadium_health_score >= 0 AND stadium_health_score <= 100)
);

-- 4. Incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('crowd', 'medical', 'security', 'facility', 'weather')),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('reported', 'responding', 'resolved')),
  location VARCHAR(255) NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,
  escalation_level INTEGER DEFAULT 1 NOT NULL CHECK (escalation_level >= 1 AND escalation_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Simulations table
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN ('emergency_evacuation', 'crowd_surge', 'weather_disruption', 'resource_stress_test')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'completed')),
  intensity VARCHAR(50) NOT NULL CHECK (intensity IN ('medium', 'high', 'extreme')),
  findings TEXT,
  mitigation_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. AI Recommendations table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('crowd_control', 'emergency', 'resource_allocation', 'logistics')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  insight TEXT NOT NULL,
  action_plan TEXT[] NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  is_applied BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('incident', 'ai_warning', 'system')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  escalation_workflow TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Accessibility Services table
CREATE TABLE IF NOT EXISTS public.accessibility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('elevators', 'wheelchair_rental', 'sensory_room', 'accessible_restrooms', 'shuttle_service')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('operational', 'limited', 'maintenance')),
  location_details VARCHAR(255) NOT NULL,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. Transport Updates table
CREATE TABLE IF NOT EXISTS public.transport_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('metro', 'bus', 'shuttle', 'rideshare', 'parking')),
  route_or_zone VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('smooth', 'delayed', 'congested', 'suspended')),
  estimated_wait_minutes INTEGER NOT NULL CHECK (estimated_wait_minutes >= 0),
  sustainability_score INTEGER NOT NULL CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =======================================================
-- Indexes for Query Optimization
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_stadium_metrics_stadium_timestamp ON public.stadium_metrics (stadium_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_stadium_status ON public.incidents (stadium_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents (severity);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_accessibility_services_stadium ON public.accessibility_services (stadium_id);
CREATE INDEX IF NOT EXISTS idx_transport_updates_stadium ON public.transport_updates (stadium_id);

-- =======================================================
-- Row Level Security (RLS) Policies
-- =======================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stadiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stadium_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_updates ENABLE ROW LEVEL SECURITY;

-- 1. Users policies: users can read all user profile names/roles but only edit their own
CREATE POLICY "Users can read all profiles" ON public.users 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.users 
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Stadiums: anyone (authenticated) can read, only admin can write
CREATE POLICY "Anyone authenticated can view stadiums" ON public.stadiums 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert/update stadiums" ON public.stadiums 
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Stadium Metrics: viewable by authenticated users; insertable by admins/operations
CREATE POLICY "Anyone authenticated can view metrics" ON public.stadium_metrics 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operations and Admins can insert metrics" ON public.stadium_metrics 
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations'))
  );

-- 4. Incidents: read by authenticated users, insert by anyone authenticated (venue staff, volunteer, fan reports)
CREATE POLICY "Authenticated users can read incidents" ON public.incidents 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can report incidents" ON public.incidents 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Operations/Staff can update incidents" ON public.incidents 
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations', 'venue_staff'))
  );

-- 5. Simulations: view/create limited to operations/admins
CREATE POLICY "Operations/Admins can select simulations" ON public.simulations 
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations'))
  );

CREATE POLICY "Operations/Admins can control simulations" ON public.simulations 
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations'))
  );

-- 6. AI Recommendations: view/apply limited to operations/admins
CREATE POLICY "Operations/Admins can read/update recommendations" ON public.ai_recommendations 
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations'))
  );

-- 7. Notifications: anyone authenticated can read notifications
CREATE POLICY "Anyone authenticated can view notifications" ON public.notifications 
  FOR SELECT TO authenticated USING (true);

-- 8. Accessibility: anyone can view, staff can edit
CREATE POLICY "Anyone authenticated can view accessibility services" ON public.accessibility_services 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operations/Staff can manage accessibility services" ON public.accessibility_services 
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations', 'venue_staff'))
  );

-- 9. Transport Updates: anyone can view, operations can edit
CREATE POLICY "Anyone authenticated can view transport updates" ON public.transport_updates 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operations can manage transport updates" ON public.transport_updates 
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations'))
  );
