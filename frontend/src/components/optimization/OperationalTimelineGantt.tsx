import React from 'react';
import { Clock } from 'lucide-react';
import type { RecommendedAction } from '../../types';

interface OperationalTimelineGanttProps {
  actions: RecommendedAction[];
}

export const OperationalTimelineGantt: React.FC<OperationalTimelineGanttProps> = ({ actions }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Operational Execution Timeline & Sequence</span>
        </h4>
        <span className="text-[10px] font-mono text-slate-400">60-minute load management window</span>
      </div>

      <div className="space-y-3 pt-2">
        {actions.map((act) => (
          <div key={act.id} className="space-y-1 text-xs">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-white font-semibold">
                {act.feeder_code} — {act.consumer_group_name} ({act.action})
              </span>
              <span className="text-slate-400">
                T+00 to T+{act.duration_mins}m (-{act.load_mw.toFixed(2)} MW)
              </span>
            </div>
            <div className="h-4 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative">
              <div
                className={`h-full rounded transition-all ${
                  act.action === 'REDUCE'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}
                style={{ width: `${Math.min(100, (act.duration_mins / 60) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
