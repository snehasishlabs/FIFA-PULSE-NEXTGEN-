import { useApp } from '../../app/AppContext';
import AccessibilitySettings from './AccessibilitySettings';

export default function AccessibilityPage() {
  const {
    activeStadium,
    accessibility,
    highContrast,
    setHighContrast,
    textSize,
    setTextSize
  } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">ADA Assist Center</h2>
          <p className="text-xs text-slate-500 font-mono">WCAG AA ACCESSIBLE FONTS, SCREEN-READERS, AND PHYSICAL SERVICE STATUSES</p>
        </div>
      </div>

      <AccessibilitySettings
        activeStadium={activeStadium!}
        accessibility={accessibility}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        textSize={textSize}
        setTextSize={setTextSize}
      />
    </div>
  );
}
