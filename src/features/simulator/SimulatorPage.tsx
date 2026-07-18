import { useApp } from '../../app/AppContext';
import Simulator from './Simulator';

export default function SimulatorPage() {
  const {
    activeStadium,
    simulations,
    currentUser,
    runSimulation
  } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Match Day Simulator</h2>
          <p className="text-xs text-slate-500 font-mono">STRESS TEST OPERATION PROCEDURES & METRICS INFLUENCE GENERATION</p>
        </div>
      </div>

      <Simulator
        activeStadium={activeStadium!}
        simulations={simulations}
        userRole={currentUser?.role || 'operations'}
        runSimulation={runSimulation}
      />
    </div>
  );
}
