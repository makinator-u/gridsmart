import React from 'react';
import { Zap } from 'lucide-react';
import type { FeederDraft } from './WizardStep2';

interface ConsumerGroupsProps {
  feeders: FeederDraft[];
  step: 3 | 4 | 5;
}

const stepTitle: Record<3 | 4 | 5, string> = {
  3: 'Step 3: Consumer Group Categories',
  4: 'Step 4: Load Importance & Priorities',
  5: 'Step 5: Initial Feeder Load Breakdown',
};

export const WizardSteps345: React.FC<ConsumerGroupsProps> = ({ feeders, step }) => (
  <div className="space-y-4">
    <h3 className="font-bold text-white text-sm">{stepTitle[step]}</h3>
    <p className="text-xs text-slate-400">
      Priority scale: Priority 1 (Must Stay ON — Hospital/Water Supply), Priority 3 (Residential), Priority 4
      (Flexible Agriculture/Commercial).
    </p>
    <div className="space-y-3">
      {feeders.map((f, fIdx) => (
        <div key={fIdx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
          <div className="font-bold text-emerald-400">
            Feeder {f.feeder_id} — {f.name}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {f.groups.map((cg, gIdx) => (
              <div key={gIdx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="font-semibold text-white">{cg.consumer_type}</div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Power: {cg.power_mw} MW</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      cg.priority === 1 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    Priority {cg.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface ReviewProps {
  substationName: string;
  capacityMw: number;
  availableMw: number;
  feeders: FeederDraft[];
  isSubmitting: boolean;
  onConfirm: () => void;
}

export const WizardStep6: React.FC<ReviewProps> = ({
  substationName,
  capacityMw,
  availableMw,
  feeders,
  isSubmitting,
  onConfirm,
}) => (
  <div className="space-y-4">
    <h3 className="font-bold text-white text-sm">Step 6: Review Grid Configuration</h3>
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
      {[
        { label: 'Substation', value: substationName, color: 'text-white' },
        { label: 'Substation Capacity', value: `${capacityMw} MW`, color: 'text-emerald-400' },
        { label: 'Available Generation', value: `${availableMw} MW`, color: 'text-cyan-400' },
        { label: 'Configured Feeders', value: `${feeders.length} Feeders`, color: 'text-white' },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex justify-between text-slate-300">
          <span>{label}:</span>
          <span className={`font-bold ${color}`}>{value}</span>
        </div>
      ))}
    </div>

    <button
      onClick={onConfirm}
      disabled={isSubmitting}
      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2"
    >
      <Zap className="w-4 h-4 fill-current" />
      <span>{isSubmitting ? 'Initializing Grid...' : 'CREATE GRID & START SIMULATION'}</span>
    </button>
  </div>
);
