import React from 'react';
import { Users, Activity } from 'lucide-react';
import type { FeederItem } from '../../types';

interface FeederCardProps {
  feeder: FeederItem;
  onInspect: (feederId: string) => void;
}

export const FeederCard: React.FC<FeederCardProps> = ({ feeder, onInspect }) => {
  const loadingPct = feeder.loading_pct;

  const statusBadge =
    feeder.status === 'OVERLOADED'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      : feeder.status === 'HIGH_LOADING'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : feeder.status === 'OFFLINE'
      ? 'bg-slate-800 text-slate-400 border-slate-700'
      : feeder.status === 'MAINTENANCE'
      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  const barColor =
    loadingPct > 100 ? 'bg-rose-500' : loadingPct >= 85 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div
      onClick={() => onInspect(feeder.feeder_id)}
      className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-sm group"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
              {feeder.feeder_id}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${statusBadge}`}>
              {feeder.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{feeder.feeder_name}</p>
        </div>

        <span className="p-1.5 bg-slate-950 rounded-lg text-slate-400 group-hover:text-emerald-400">
          <Activity className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Capacity Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold">{feeder.current_load_mw.toFixed(2)} MW</span>
          <span className="text-slate-400">Cap: {feeder.capacity_mw.toFixed(1)} MW ({loadingPct}%)</span>
        </div>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className={`h-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, loadingPct)}%` }}
          />
        </div>
      </div>

      {/* Connected Villages */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Users className="w-3 h-3 text-emerald-400" />
          <span>Villages ({feeder.villages.length}):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {feeder.villages.slice(0, 3).map((v) => (
            <span
              key={v.id}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono"
            >
              {v.name}
            </span>
          ))}
          {feeder.villages.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 font-mono">
              +{feeder.villages.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
