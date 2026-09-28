import React, { useState, useEffect } from 'react';
import { Scale, ShieldCheck } from 'lucide-react';
import type { OutageBalance } from '../types';
import { api } from '../api/client';

export const OutageEquityView: React.FC = () => {
  const [data, setData] = useState<OutageBalance | null>(null);

  useEffect(() => {
    fetchOutages();
  }, []);

  const fetchOutages = async () => {
    try {
      const res = await api.getOutages();
      setData(res);
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <span>Outage Equity & Interruption Fairness Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitors cumulative interruption hours per village to enforce equitable load shedding and prevent systemic bias.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-slate-400">Active Interruption Events:</span>
          <span className="text-emerald-400 font-bold text-sm">{data.total_active_outages}</span>
        </div>
      </div>

      {/* Outage Balance Visual Progress Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
          Village Interruption Balance Today (Hours)
        </h3>

        <div className="space-y-4 font-mono text-xs">
          {data.village_outage_balance.map((v, idx) => {
            const barWidth = Math.min(100, (v.outage_hours_today / 4.0) * 100);
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-bold text-white">{v.village_name} ({v.feeder_code})</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{v.outage_hours_today} hrs today</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.equity_status === 'POOR'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : v.equity_status === 'MODERATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      EQUITY: {v.equity_status}
                    </span>
                  </div>
                </div>

                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      v.outage_hours_today >= 2.0
                        ? 'bg-rose-500'
                        : v.outage_hours_today >= 1.0
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(4, barWidth)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Interruption Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
          Active Outage & Interruption Records
        </h3>

        {data.active_outage_records.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs space-y-1">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-slate-300 font-medium">No Active Outages</p>
            <p>All villages and consumer groups currently receive full electrical power supply.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Village / Group</th>
                  <th className="p-2.5">Reason</th>
                  <th className="p-2.5">Start Time</th>
                  <th className="p-2.5">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.active_outage_records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-bold text-white">{r.village_name}</td>
                    <td className="p-2.5 text-slate-300">{r.reason}</td>
                    <td className="p-2.5 text-slate-400">{r.start_time}</td>
                    <td className="p-2.5 text-amber-400 font-bold">{r.duration_hours} hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
