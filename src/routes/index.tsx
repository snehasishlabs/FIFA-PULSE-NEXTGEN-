import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import MainLayout from '../components/MainLayout';

// Lazy loading views for high efficiency and speedier startup
const Login = lazy(() => import('../features/auth/Login'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const StadiumIntelligencePage = lazy(() => import('../features/dashboard/StadiumIntelligencePage'));
const AIAssistantPage = lazy(() => import('../features/ai-assistant/AIAssistantPage'));
const SimulatorPage = lazy(() => import('../features/simulator/SimulatorPage'));
const LogisticsPage = lazy(() => import('../features/logistics/LogisticsPage'));
const AccessibilityPage = lazy(() => import('../features/accessibility/AccessibilityPage'));
const NotificationsPage = lazy(() => import('../features/notifications/NotificationsPage'));

function ViewSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800 animate-pulse">
        <div className="w-8 h-8 border-2 border-t-sky-500 border-slate-700 rounded-full animate-spin mb-3"></div>
        <p className="text-slate-400 text-xs font-mono tracking-widest">LOADING CONSOLE MODULE...</p>
      </div>
    }>
      {children}
    </Suspense>
  );
}

export default function AppRouter() {
  const { currentUser, changeRole, loading } = useApp();

  const handleLogin = async (role: 'admin' | 'operations' | 'venue_staff' | 'volunteer' | 'fan', name: string) => {
    await changeRole(role, name);
  };

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Login Route */}
        <Route 
          path="/login" 
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ViewSuspense>
                <Login onLogin={handleLogin} loading={loading} />
              </ViewSuspense>
            )
          } 
        />

        {/* Protected Operational Console Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ViewSuspense>
                  <DashboardPage />
                </ViewSuspense>
              } 
            />

            <Route 
              path="/intelligence" 
              element={
                <ViewSuspense>
                  <StadiumIntelligencePage />
                </ViewSuspense>
              } 
            />

            <Route 
              path="/ai-assistant" 
              element={
                <ViewSuspense>
                  <AIAssistantPage />
                </ViewSuspense>
              } 
            />

            <Route 
              path="/simulator" 
              element={
                <ViewSuspense>
                  <SimulatorPage />
                </ViewSuspense>
              } 
            />

            <Route 
              path="/logistics" 
              element={
                <ViewSuspense>
                  <LogisticsPage />
                </ViewSuspense>
              } 
            />

            <Route 
              path="/accessibility" 
              element={
                <ViewSuspense>
                  <AccessibilityPage />
                </ViewSuspense>
              } 
            />

            <Route 
              path="/notifications" 
              element={
                <ViewSuspense>
                  <NotificationsPage />
                </ViewSuspense>
              } 
            />

          </Route>
        </Route>

        {/* Dynamic Catch-All Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
