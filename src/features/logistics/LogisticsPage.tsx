import { useApp } from '../../app/AppContext';
import Logistics from './Logistics';

export default function LogisticsPage() {
  const {
    activeStadium,
    transport
  } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Logistics & Navigation Center</h2>
          <p className="text-xs text-slate-500 font-mono">GOOGLE MAPS INTEGRATION, PEDESTRIAN ROUTING, AND SUSTAINABILITY SCORECARDS</p>
        </div>
      </div>

      <Logistics
        activeStadium={activeStadium!}
        transport={transport}
      />
    </div>
  );
}
