import React from 'react';
import { ArrowDownRight, Clock, ShieldCheck } from 'lucide-react';
import type { RecommendedAction } from '../../types';

interface RecommendedActionsTableProps {
  actions: RecommendedAction[];
}

export const RecommendedActionsTable: React.FC<RecommendedActionsTableProps> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-950 rounded-xl border border-slate-800 text-xs">
        <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
        <p className="font-semibold text-slate-300">All feeder loads are within thermal capacity limits.</p>
        <p className="text-[11px] text-slate-500 mt-0.5">No load shedding or load shifting actions required at this time.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
      <table className="w-full text-left text-xs font-mono text-slate-300">
        <thead className="bg-slate-900/90 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="py-3 px-4">Feeder Code</th>
            <th className="py-3 px-4">Consumer Group</th>
            <th className="py-3 px-4">Proposed Action</th>
            <th className="py-3 px-4">Load Delta (MW)</th>
            <th className="py-3 px-4">Duration</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {actions.map((act) => (
            <tr key={act.id} className="hover:bg-slate-900/50 transition-colors">
              <td className="py-3 px-4 font-bold text-white">{act.feeder_code}</td>
              <td className="py-3 px-4 text-slate-300">{act.consumer_group_name}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    act.action === 'REDUCE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : act.action === 'SHIFT'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {act.action}
                </span>
              </td>
              <td className="py-3 px-4 font-bold text-rose-400">
                <div className="flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>-{act.load_mw.toFixed(2)} MW</span>
                </div>
              </td>
              <td className="py-3 px-4 text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{act.duration_mins} mins</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {act.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
