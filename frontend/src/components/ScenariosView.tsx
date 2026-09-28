import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ScenarioItem } from '../types';
import { api } from '../api/client';

interface ScenariosViewProps {
  activeScenarioName: string;
  onScenarioRun: (name: string) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({ activeScenarioName, onScenarioRun }) => {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const data = await api.getScenarios();
      setScenarios(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async (name: string) => {
    onScenarioRun(name);
    setSelectedNotice(`Activated scenario: '${name}'. Simulator parameters updated.`);
    setTimeout(() => setSelectedNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-bold">
              OPERATIONAL SCENARIO SYSTEM
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Grid Operational Scenario Matrix</h2>
          <p className="text-xs text-slate-400">
            Select pre-configured seasonal demand patterns, drought conditions, or emergency feeder outages to simulate operator control room conditions.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-slate-400">Active Scenario:</span>
          <span className="text-emerald-400 font-bold">{activeScenarioName}</span>
        </div>
      </div>

      {selectedNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{selectedNotice}</span>
        </div>
      )}

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isActive = activeScenarioName.toLowerCase() === sc.name.toLowerCase();

          return (
            <div
              key={sc.name}
              className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-xl shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">{sc.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                      sc.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : sc.severity === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {sc.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{sc.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Agri Demand: {sc.agri_delta_pct > 0 ? `+${sc.agri_delta_pct}%` : 'Normal'}</span>
                  <span>Gen Delta: {sc.gen_delta_mw < 0 ? `${sc.gen_delta_mw} MW` : 'Normal'}</span>
                </div>

                <button
                  onClick={() => handleActivate(sc.name)}
                  disabled={isActive}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isActive ? 'ACTIVE SCENARIO' : 'ACTIVATE SCENARIO'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
