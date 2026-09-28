import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Zap, AlertTriangle, Flame, ShieldAlert, Wrench, CheckCircle2 } from 'lucide-react';
import type { GridStatus, FeederItem } from '../types';
import { api } from '../api/client';

interface SimulationViewProps {
  status: GridStatus | null;
  feeders?: FeederItem[];
  onControl: (action: 'start' | 'pause' | 'reset', speed?: number) => void;
  onInjectEvent: (eventType: string, feederCode?: string, magnitudeMw?: number) => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ status, feeders: propFeeders, onControl, onInjectEvent }) => {
  const [fallbackFeeders, setFallbackFeeders] = useState<FeederItem[]>([]);
  const [selectedFeeder, setSelectedFeeder] = useState<string>('');
  const [magnitude, setMagnitude] = useState<number>(1.5);
  const [injectedNotice, setInjectedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!propFeeders || propFeeders.length === 0) {
      api.getFeeders().then(setFallbackFeeders).catch(console.error);
    }
  }, [propFeeders]);

  if (!status) return null;

  const availableFeeders = propFeeders && propFeeders.length > 0 ? propFeeders : fallbackFeeders;
  const currentFeeder = selectedFeeder || availableFeeders[0]?.feeder_id || '';

  const handleInject = (eventType: string) => {
    onInjectEvent(eventType, currentFeeder, magnitude);
    setInjectedNotice(`Event '${eventType}' injected on Feeder ${currentFeeder} (+${magnitude} MW).`);
    setTimeout(() => setInjectedNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                SIMULATION MODE ACTIVE
              </span>
              <span className="text-xs font-mono text-slate-400">Data Source: {status.data_source}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Live Feeder Simulation Engine</h2>
            <p className="text-xs text-slate-400">
              Control simulation time progression, adjust playback speed, and trigger interactive operational events.
            </p>
          </div>

          {/* Simulation Time Clock & Controls */}
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Simulated Clock:</span>
              <span className="text-xl font-bold text-emerald-400">{status.simulation_time}</span>
            </div>

            <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
              <button
                onClick={() => onControl(status.is_running ? 'pause' : 'start')}
                className={`p-2 rounded-lg font-bold transition-all ${
                  status.is_running
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {status.is_running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onControl('reset')}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
                title="Reset Simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
              {[1, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => onControl('start', s)}
                  className={`px-2 py-1 rounded text-xs ${
                    status.speed_multiplier === s
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Grid State Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Available Power</span>
            <span className="text-lg font-bold text-cyan-400">{status.available_power_mw} MW</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Current Demand</span>
            <span className="text-lg font-bold text-white">{status.total_demand_mw} MW</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Power Deficit</span>
            <span className={`text-lg font-bold ${status.current_shortage_mw > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {status.current_shortage_mw} MW
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Active Scenario</span>
            <span className="text-base font-bold text-amber-300 truncate block">{status.active_scenario}</span>
          </div>
        </div>
      </div>

      {/* Interactive Event Injection Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Interactive Operator Event Injection</span>
            </h3>
            <p className="text-xs text-slate-400">
              Inject real-time demand spikes, generation drops, or feeder faults to evaluate system detection and MILP optimizer response.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 mr-2">Target Feeder:</label>
              <select
                value={currentFeeder}
                onChange={(e) => setSelectedFeeder(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-emerald-400 font-bold outline-none"
              >
                {availableFeeders.map((f) => (
                  <option key={f.id || f.feeder_id} value={f.feeder_id}>
                    {f.feeder_id} - {f.feeder_name || f.feeder_id} ({f.current_load_mw} MW)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 mr-2">Delta (MW):</label>
              <input
                type="number"
                step="0.5"
                value={magnitude}
                onChange={(e) => setMagnitude(parseFloat(e.target.value) || 1.5)}
                className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-center font-bold"
              />
            </div>
          </div>
        </div>

        {injectedNotice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{injectedNotice}</span>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleInject('INCREASE_AGRICULTURE')}
            className="p-4 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-200 rounded-xl text-xs font-bold text-left space-y-1 transition-all"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <Zap className="w-4 h-4" />
              <span>Increase Agricultural Load</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Spikes irrigation pump load on {selectedFeeder} by +{magnitude} MW.</p>
          </button>

          <button
            onClick={() => handleInject('INCREASE_RESIDENTIAL')}
            className="p-4 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-200 rounded-xl text-xs font-bold text-left space-y-1 transition-all"
          >
            <div className="flex items-center gap-2 text-cyan-400">
              <Flame className="w-4 h-4" />
              <span>Increase Residential Demand</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Simulates evening domestic demand peak (+{magnitude} MW).</p>
          </button>

          <button
            onClick={() => handleInject('REDUCE_GENERATION')}
            className="p-4 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-200 rounded-xl text-xs font-bold text-left space-y-1 transition-all"
          >
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Reduce Power Generation</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Reduces available substation capacity by -{magnitude} MW.</p>
          </button>

          <button
            onClick={() => handleInject('TRIP_FEEDER')}
            className="p-4 bg-slate-950 border border-rose-500/50 hover:bg-rose-500/10 text-rose-300 rounded-xl text-xs font-bold text-left space-y-1 transition-all"
          >
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Trip Feeder (Fault)</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Forces feeder {selectedFeeder} to OFFLINE state.</p>
          </button>

          <button
            onClick={() => handleInject('MAINTENANCE')}
            className="p-4 bg-slate-950 border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-300 rounded-xl text-xs font-bold text-left space-y-1 transition-all"
          >
            <div className="flex items-center gap-2 text-cyan-400">
              <Wrench className="w-4 h-4" />
              <span>Start Maintenance</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Places feeder {selectedFeeder} into MAINTENANCE mode.</p>
          </button>

          <button
            onClick={() => handleInject('RESTORE_FEEDER')}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-200 rounded-xl text-xs font-bold text-left space-y-1 transition-all"
          >
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Restore Feeder to Normal</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Clears fault/maintenance and restores {selectedFeeder} to NORMAL.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
