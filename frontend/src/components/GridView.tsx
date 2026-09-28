import React, { useState, useEffect } from 'react';
import { Network, Zap, Server, X } from 'lucide-react';
import type { NetworkTree } from '../types';
import { api } from '../api/client';

export const GridView: React.FC = () => {
  const [tree, setTree] = useState<NetworkTree | null>(null);
  const [selectedFeederCode, setSelectedFeederCode] = useState<string | null>(null);

  useEffect(() => {
    fetchTree();
    const interval = setInterval(fetchTree, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchTree = async () => {
    try {
      const res = await api.getNetworkTree();
      setTree(res);
    } catch (err) {
      console.error(err);
    }
  };

  if (!tree || !tree.substation) return null;

  const selectedFeeder = tree.feeders.find((f) => f.code === selectedFeederCode);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-emerald-400" />
            <span>Distribution Network Topology View</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual tree diagram of rural distribution substation, 11kV feeder lines, and connected villages.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono flex-wrap bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Normal (&lt;85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-slate-300">High (&gt;85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-300">Overloaded (&gt;100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-600" />
            <span className="text-slate-300">Offline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Network Diagram Tree */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-10 min-h-[500px] flex flex-col items-center justify-start space-y-8 overflow-x-auto">
        {/* Level 1: Substation Root Node */}
        <div className="flex flex-col items-center">
          <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-emerald-500/50 rounded-2xl shadow-xl shadow-emerald-500/10 text-center min-w-[260px] space-y-1">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
              <Server className="w-5 h-5" />
              <span>{tree.substation.name}</span>
            </div>
            <div className="text-xs font-mono text-slate-300">
              Capacity: {tree.substation.capacity_mw} MW | Available: {tree.substation.available_power_mw} MW
            </div>
            <div className="text-[10px] font-mono text-slate-400">Voltage: {tree.substation.voltage_level_kv} kV</div>
          </div>
          {/* Vertical stem connector */}
          <div className="w-0.5 h-8 bg-emerald-500/40" />
          {/* Horizontal crossbar connector */}
          <div className="w-full max-w-4xl h-0.5 bg-emerald-500/40" />
        </div>

        {/* Level 2: Feeder Line Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full max-w-6xl">
          {tree.feeders.map((f) => {
            const statusBg =
              f.status === 'OVERLOADED'
                ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-rose-500/20'
                : f.status === 'HIGH_LOADING'
                ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-amber-500/20'
                : f.status === 'OFFLINE'
                ? 'bg-slate-950 border-slate-700 text-slate-500'
                : f.status === 'MAINTENANCE'
                ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10';

            const stemColor =
              f.status === 'OVERLOADED'
                ? 'bg-rose-500'
                : f.status === 'HIGH_LOADING'
                ? 'bg-amber-400'
                : f.status === 'OFFLINE'
                ? 'bg-slate-700'
                : 'bg-emerald-500/50';

            return (
              <div key={f.id} className="flex flex-col items-center group">
                {/* Connector stem */}
                <div className={`w-0.5 h-6 ${stemColor}`} />

                {/* Feeder Card */}
                <div
                  onClick={() => setSelectedFeederCode(f.code)}
                  className={`w-full p-3 rounded-xl border-2 ${statusBg} cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-lg space-y-2`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{f.code}</span>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  </div>
                  <div className="text-[11px] font-semibold truncate text-slate-200">{f.name}</div>

                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>{f.current_load_mw} MW</span>
                      <span>{f.loading_pct}%</span>
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

                  {/* Connected Villages */}
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300 block">Villages:</span>
                    {f.villages.map((v, vIdx) => (
                      <div key={vIdx} className="truncate bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300">
                        • {v}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Feeder Side Modal / Panel */}
      {selectedFeeder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-6 overflow-y-auto animate-in slide-in-from-right">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span>Feeder {selectedFeeder.code}</span>
                </h3>
                <p className="text-xs text-slate-400">{selectedFeeder.name}</p>
              </div>
              <button
                onClick={() => setSelectedFeederCode(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Operating Status:</span>
                  <span className="font-bold text-emerald-400">{selectedFeeder.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity:</span>
                  <span className="text-white">{selectedFeeder.capacity_mw} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Load:</span>
                  <span className="text-white">{selectedFeeder.current_load_mw} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Loading %:</span>
                  <span className="text-amber-400 font-bold">{selectedFeeder.loading_pct}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-white block">Connected Villages:</span>
                <div className="space-y-1">
                  {selectedFeeder.villages.map((v, idx) => (
                    <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                      {v}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 space-y-1">
                <div className="font-bold">Load Protection Summary</div>
                <div>Critical Protected Load: {selectedFeeder.critical_load_mw} MW</div>
                <div>Flexible Sheddable Load: {selectedFeeder.flexible_load_mw} MW</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
