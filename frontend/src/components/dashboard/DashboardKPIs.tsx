import React from 'react';
import { Activity, Zap, ShieldAlert, Scale } from 'lucide-react';
import type { GridStatus } from '../../types';

interface DashboardKPIsProps {
  status: GridStatus;
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({ status }) => {
  const demandPct = Math.min(100, (status.total_demand_mw / Math.max(1, status.available_power_mw)) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Feeders & Health */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Total Feeders</span>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{status.total_feeders}</span>
          <span className="text-xs text-slate-400 font-mono">11kV Feeders</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-xs font-mono">
          <span className="text-emerald-400">{status.normal_feeders} Normal</span>
          <span className="text-amber-400">{status.warning_feeders} High</span>
          <span className="text-rose-400">{status.overloaded_feeders} Overloaded</span>
        </div>
      </div>

      {/* Current Demand vs Available Power */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Load Classification</span>
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-emerald-400">{status.critical_load_mw.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-mono ml-1">MW Critical</span>
          </div>
          <div className="text-right">
            <span className="text-base font-semibold text-amber-400">{status.flexible_load_mw.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-mono ml-1">MW Flex</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800 flex justify-between">
          <span>Protected: 100%</span>
          <span>Shiftable: Agriculture/Comm</span>
        </div>
      </div>

      {/* Active Outages & Equity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Active Load Outages</span>
          <Scale className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{status.current_outages_count}</span>
          <span className="text-xs text-slate-400 font-mono">Managed Feeders</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800 flex justify-between">
          <span>Fairness Engine:</span>
          <span className="text-emerald-400 font-semibold">Active</span>
        </div>
      </div>
    </div>
  );
};
