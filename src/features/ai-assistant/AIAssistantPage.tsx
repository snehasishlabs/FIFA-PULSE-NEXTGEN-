import { useApp } from '../../app/AppContext';
import AIAssistant from './AIAssistant';

export default function AIAssistantPage() {
  const {
    activeStadium,
    recommendations,
    currentUser,
    applyRecommendation
  } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">AI Operations Assistant</h2>
          <p className="text-xs text-slate-500 font-mono">GEMINI OPERATIONAL DIRECTIVES & SECURE COMMAND DIALOG</p>
        </div>
      </div>
      
      <AIAssistant
        activeStadium={activeStadium!}
        recommendations={recommendations}
        userRole={currentUser?.role || 'operations'}
        applyRecommendation={applyRecommendation}
      />
    </div>
  );
}
