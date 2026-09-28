import React from 'react';
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Scale,
  Activity,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { GridStatus, FeederItem, GridAlert, OptimizationRun } from '../types';

interface DashboardViewProps {
  status: GridStatus | null;
  feeders: FeederItem[];
  alerts: GridAlert[];
  recommendations: OptimizationRun | null;
  outages: any;
  onNavigate: (tab: string) => void;
  onRunOptimization: () => void;
  onInjectEvent: (eventType: string, feederCode?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  feeders,
  alerts,
  recommendations,
  onNavigate,
  onRunOptimization,
  onInjectEvent,
}) => {
  if (!status) return null;

  const demandPct = Math.min(100, (status.total_demand_mw / maxVal(status.available_power_mw)) * 100);
  function maxVal(val: number) {
    return val > 0 ? val : 1;
  }

  return (
    <div className="space-y-6">
      {/* Quick Action & Simulation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
              Data Source: {status.data_source}
            </span>
            <span className="text-xs font-mono px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
              Scenario: {status.active_scenario}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-2">Distribution Operator Control Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time decision support for rural feeder optimization, overload prevention, and load shedding equity.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const agriFeeder = feeders.find(f => f.consumer_groups?.some(cg => cg.type === 'Agriculture'))?.feeder_id || feeders[0]?.feeder_id;
              onInjectEvent('INCREASE_AGRICULTURE', agriFeeder);
            }}
            className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Inject Agri Demand Surge</span>
          </button>

          <button
            onClick={onRunOptimization}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Brain className="w-4 h-4" />
            <span>Generate MILP Plan</span>
          </button>
        </div>
      </div>

      {/* Grid Status Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Feeders & Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Feeders</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{status.total_feeders}</span>
            <span className="text-xs text-slate-400 font-mono">11kV Feeder Lines</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-xs font-mono">
            <span className="text-emerald-400">{status.normal_feeders} Normal</span>
            <span className="text-amber-400">{status.warning_feeders} High</span>
            <span className="text-rose-400">{status.overloaded_feeders} Overloaded</span>
          </div>
        </div>

        {/* Current Demand vs Available Power */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Demand / Supply</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-white">{status.total_demand_mw}</span>
              <span className="text-xs text-slate-400 font-mono ml-1">MW Demand</span>
            </div>
            <div className="text-right">
              <span className="text-base font-semibold text-cyan-400">{status.available_power_mw}</span>
              <span className="text-xs text-slate-400 font-mono ml-1">MW Avail</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  status.current_shortage_mw > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, demandPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Loading: {demandPct.toFixed(1)}%</span>
              {status.current_shortage_mw > 0 ? (
                <span className="text-rose-400 font-bold">Shortage: -{status.current_shortage_mw} MW</span>
              ) : (
                <span className="text-emerald-400">Reserve: +{(status.available_power_mw - status.total_demand_mw).toFixed(1)} MW</span>
              )}
            </div>
          </div>
        </div>

        {/* Critical & Flexible Load */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Load Classification</span>
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[10px]">Critical Load</span>
              <span className="text-lg font-bold text-indigo-300">{status.critical_load_mw} MW</span>
              <span className="text-[10px] text-emerald-400 block font-mono">100% Protected</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[10px]">Flexible Load</span>
              <span className="text-lg font-bold text-amber-300">{status.flexible_load_mw} MW</span>
              <span className="text-[10px] text-amber-400 block font-mono">Sheddable</span>
            </div>
          </div>
        </div>

        {/* Active Outages & Equity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Outage Management</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{status.current_outages_count}</span>
            <span className="text-xs text-slate-400 font-mono">Active Outages</span>
          </div>
          <button
            onClick={() => onNavigate('equity')}
            className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center justify-between transition-colors font-medium"
          >
            <span>View Outage Balance</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Grid Section: Active Alerts & Recommended Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Alerts & Feeder Quick Health */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Alerts Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Active Grid Alerts & AI Detections</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                {alerts.length} Active
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                <p className="text-slate-300 font-medium">Grid Operating Normally</p>
                <p>No feeder overloads or supply shortages detected.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      al.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : al.severity === 'WARNING'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${al.severity === 'CRITICAL' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                        {al.title}
                      </span>
                      <span className="font-mono text-[10px] uppercase opacity-80">{al.type}</span>
                    </div>
                    <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{al.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feeder Status Overview Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Feeder Line Status Summary</h3>
              <button
                onClick={() => onNavigate('grid-view')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>View Interactive Topology</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {feeders.map((f) => {
                const statusColor =
                  f.status === 'OVERLOADED'
                    ? 'border-rose-500/50 bg-rose-500/5 text-rose-400'
                    : f.status === 'HIGH_LOADING'
                    ? 'border-amber-500/50 bg-amber-500/5 text-amber-400'
                    : f.status === 'OFFLINE'
                    ? 'border-slate-700 bg-slate-950 text-slate-500'
                    : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400';

                return (
                  <div
                    key={f.id}
                    onClick={() => onNavigate('feeder-details')}
                    className={`p-3 rounded-xl border ${statusColor} cursor-pointer hover:border-slate-600 transition-all space-y-2`}
                  >
                    <div className="flex justify-between items-center font-bold text-xs">
                      <span>{f.feeder_id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-slate-950/60 border border-current">
                        {f.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{f.feeder_name}</div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Load: {f.current_load_mw} MW</span>
                        <span>Cap: {f.capacity_mw} MW</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            f.loading_pct > 100 ? 'bg-rose-500' : f.loading_pct >= 85 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, f.loading_pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Latest Recommended Plan & Actions */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Recommended Operating Plan</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                MILP
              </span>
            </div>

            {recommendations ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400 font-mono">
                    <span>Plan ID #{recommendations.optimization_id}</span>
                    <span className="text-emerald-400">{recommendations.status}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white text-sm">
                    <span>Deficit: {recommendations.shortage_mw} MW</span>
                    <span className="text-slate-400 font-normal text-xs">{recommendations.timestamp}</span>
                  </div>
                </div>

                {/* Actions Table preview */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Action Recommendations:</span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {recommendations.recommended_actions
                      .filter((a) => a.load_mw > 0)
                      .slice(0, 4)
                      .map((a) => (
                        <div
                          key={a.id}
                          className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-emerald-400">{a.feeder_code}</span>
                            <span className="text-slate-300 ml-2 font-medium">{a.consumer_group_name}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] font-mono rounded border border-amber-500/20">
                              {a.action} {a.load_mw} MW
                            </span>
                          </div>
                        </div>
                      ))}
                    {recommendations.recommended_actions.filter((a) => a.load_mw > 0).length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-3">All feeders operating normally. No reductions required.</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('optimization')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <span>Review & Approve Operating Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-slate-400">No active operating plan generated yet.</p>
                <button
                  onClick={onRunOptimization}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Generate Plan Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
