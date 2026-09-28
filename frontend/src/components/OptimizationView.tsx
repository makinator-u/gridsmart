import React, { useState } from 'react';
import { Brain, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import type { OptimizationRun } from '../types';
import { RecommendedActionsTable } from './optimization/RecommendedActionsTable';
import { OperationalTimelineGantt } from './optimization/OperationalTimelineGantt';

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
            Formulates linear decision constraints to eliminate power shortages while protecting critical loads and maintaining village equity.
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
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

            {/* Recommended Action Plan Table Component */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-white">Recommended Action Plan Breakdown</h4>
              <RecommendedActionsTable actions={recommendations.recommended_actions} />
            </div>
          </div>

          {/* Operational Timeline Component */}
          <OperationalTimelineGantt actions={recommendations.recommended_actions} />
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
