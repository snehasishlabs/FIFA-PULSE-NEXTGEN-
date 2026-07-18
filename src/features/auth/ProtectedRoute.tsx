import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../../app/AppContext';

export default function ProtectedRoute() {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans p-6 animate-pulse">
        <div className="w-16 h-16 border-4 border-slate-800 border-t-sky-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">SYNCHRONIZING OPERATIONAL TRUST CREDENTIALS...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
