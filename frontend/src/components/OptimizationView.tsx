import React, { useState } from 'react';
import { Brain, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import type { OptimizationRun } from '../types';

interface OptimizationViewProps {
  recommendations: OptimizationRun | null;
  onRunOptimization: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  recommendations,
  onRunOptimization,
  onApprove,
  onReject,
}) => {
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleApprove = (id: number) => {
    onApprove(id);
    setActionNotice(`Plan #${id} APPROVED by Operator. Grid state updated in simulator.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = (id: number) => {
    onReject(id);
    setActionNotice(`Plan #${id} REJECTED by Operator. No grid changes applied.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
              MILP OPTIMIZATION ENGINE
            </span>
            <span className="text-xs font-mono text-slate-400">PuLP CBC Solver</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Operator Decision Support & Load Management Plan</h2>
          <p className="text-xs text-slate-400">
            Formulates linear decision constraints to eliminate power shortage while protecting critical loads and maintaining village equity.
          </p>
        </div>

        <button
          onClick={onRunOptimization}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          <span>Run MILP Optimization Solver</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {recommendations ? (
        <div className="space-y-6">
          {/* Optimization Run Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                  <span>Optimization Run #{recommendations.optimization_id}</span>
                  <span>•</span>
                  <span>{recommendations.timestamp}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">Recommended Load Management Plan</h3>
              </div>

              {/* Status Badge & Approve/Reject Action Buttons */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                    recommendations.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : recommendations.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  STATUS: {recommendations.status}
                </span>

                {recommendations.status === 'RECOMMENDED' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(recommendations.optimization_id)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Plan</span>
                    </button>
                    <button
                      onClick={() => handleReject(recommendations.optimization_id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Total Demand</span>
                <span className="text-base font-bold text-white">{recommendations.total_demand_mw} MW</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Available Supply</span>
                <span className="text-base font-bold text-cyan-400">{recommendations.available_power_mw} MW</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Power Deficit</span>
                <span className="text-base font-bold text-rose-400">{recommendations.shortage_mw} MW</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Critical Load Status</span>
                <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> 100% Protected
                </span>
              </div>
            </div>

            {/* Recommended Action Plan Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-white">Recommended Action Plan Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Feeder</th>
                      <th className="p-2.5">Consumer Group</th>
                      <th className="p-2.5">Recommended Action</th>
                      <th className="p-2.5">Target MW</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {recommendations.recommended_actions.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-emerald-400">{a.feeder_code}</td>
                        <td className="p-2.5 text-white font-medium">{a.consumer_group_name}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              a.action === 'REDUCE'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : a.action === 'SHIFT'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {a.action}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-white">{a.load_mw > 0 ? `-${a.load_mw} MW` : '0.0 MW (Full Power)'}</td>
                        <td className="p-2.5 text-slate-400">{a.duration_mins} mins</td>
                        <td className="p-2.5 font-bold text-slate-400">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Operational Timeline (Section 19) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Operational Action Timeline (14:00 – 18:00)</span>
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {['F01', 'F02', 'F03', 'F04', 'F05', 'F06'].map((code) => {
                const action = recommendations.recommended_actions.find((a) => a.feeder_code === code && a.load_mw > 0);
                return (
                  <div key={code} className="space-y-1">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>Feeder {code}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {action ? `${action.action} ${action.load_mw} MW` : 'NORMAL OPERATION'}
                      </span>
                    </div>

                    <div className="h-6 w-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center p-1 text-[10px]">
                      <div className="h-full bg-emerald-500/60 rounded text-slate-950 font-bold px-2 flex items-center" style={{ width: action ? '45%' : '100%' }}>
                        NORMAL
                      </div>
                      {action && (
                        <>
                          <div className="h-full bg-amber-500/80 rounded text-slate-950 font-bold px-2 flex items-center ml-1" style={{ width: '30%' }}>
                            {action.action}
                          </div>
                          <div className="h-full bg-cyan-500/60 rounded text-slate-950 font-bold px-2 flex items-center ml-1" style={{ width: '25%' }}>
                            RESTORE
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Brain className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-white">No MILP Plan Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click the button below to run the Mixed-Integer Linear Programming optimizer on current grid conditions.
          </p>
          <button
            onClick={onRunOptimization}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
          >
            Generate Recommended Operating Plan
          </button>
        </div>
      )}
    </div>
  );
};
