import React, { useState, useEffect } from 'react';
import { Activity, Users, BarChart } from 'lucide-react';
import type { FeederItem } from '../types';
import { api } from '../api/client';

export const FeederDetailView: React.FC = () => {
  const [feeders, setFeeders] = useState<FeederItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    loadFeeders();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  const loadFeeders = async () => {
    try {
      const data = await api.getFeeders();
      setFeeders(data);
      if (data.length > 0) {
        setSelectedId((prev) => (prev && data.some((f) => f.feeder_id === prev) ? prev : data[0].feeder_id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDetail = async (id: string) => {
    try {
      const data = await api.getFeederDetail(id);
      setDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!detail) return null;

  const loadingPct = ((detail.current_load_mw / maxVal(detail.capacity_mw)) * 100).toFixed(1);
  function maxVal(val: number) {
    return val > 0 ? val : 1;
  }

  return (
    <div className="space-y-6">
      {/* Header Feeder Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Feeder Detailed Telemetry & Load Inspector</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deep dive into individual feeder capacity, connected villages, consumer category breakdown, and historical readings.
          </p>
        </div>

        {/* Feeder Dropdown Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-mono">Select Feeder Line:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-emerald-400 focus:border-emerald-500 outline-none"
          >
            {feeders.map((f) => (
              <option key={f.id} value={f.feeder_id}>
                {f.feeder_id} - {f.feeder_name} ({f.current_load_mw} MW)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Feeder Capacity Gauge & Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white">{detail.feeder_id}</h3>
              <p className="text-xs text-slate-400">{detail.feeder_name}</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded-lg">
              {detail.status}
            </span>
          </div>

          {/* Capacity Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Current Load: {detail.current_load_mw} MW</span>
              <span className="text-slate-400">Max Capacity: {detail.capacity_mw} MW</span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  parseFloat(loadingPct) > 100
                    ? 'bg-rose-500'
                    : parseFloat(loadingPct) >= 85
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, parseFloat(loadingPct))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Feeder Loading:</span>
              <span className="text-amber-400 font-bold">{loadingPct}%</span>
            </div>
          </div>

          {/* Connected Villages */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300">Connected Villages:</span>
            <div className="flex flex-wrap gap-2">
              {detail.villages.map((v: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 rounded-lg"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Consumer Group Breakdown & History Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Consumer Groups List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Consumer Group Load Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {detail.consumer_groups.map((cg: any) => (
                <div key={cg.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-white">
                    <span>{cg.consumer_type}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        cg.priority === 1
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      Priority {cg.priority} {cg.is_critical && '(CRITICAL)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-mono">
                    <span>Current Draw: {cg.power_mw} MW</span>
                    <span>Flexibility: {cg.flexibility_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Load Readings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-cyan-400" />
              <span>Historical Reading Log (Last 10 Ticks)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Total Load</th>
                    <th className="p-2.5">Residential</th>
                    <th className="p-2.5">Agriculture</th>
                    <th className="p-2.5">Commercial</th>
                    <th className="p-2.5">Critical</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {detail.recent_readings.slice(0, 10).map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-white">{new Date(r.timestamp).toLocaleTimeString()}</td>
                      <td className="p-2.5 text-emerald-400 font-bold">{r.load_mw} MW</td>
                      <td className="p-2.5">{r.residential_mw} MW</td>
                      <td className="p-2.5 text-amber-300">{r.agriculture_mw} MW</td>
                      <td className="p-2.5">{r.commercial_mw} MW</td>
                      <td className="p-2.5 text-indigo-300 font-bold">{r.critical_mw} MW</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
