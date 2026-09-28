import React from 'react';
import { AlertTriangle, ShieldAlert, Brain, CheckCircle2 } from 'lucide-react';
import type { GridAlert } from '../types';

interface AlertsViewProps {
  alerts: GridAlert[];
  onRunOptimization: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onRunOptimization }) => {
  const overloads = alerts.filter((a) => a.type === 'FEEDER_OVERLOAD');
  const shortages = alerts.filter((a) => a.type === 'POWER_SHORTAGE');
  const anomalies = alerts.filter((a) => a.type === 'AI_ANOMALY');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Problem Detection & AI Anomaly Monitor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Combines rule-based overload checking with scikit-learn Isolation Forest machine learning anomaly detection.
          </p>
        </div>

        <button
          onClick={onRunOptimization}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
        >
          <Brain className="w-4 h-4" />
          <span>Solve Deficit with MILP</span>
        </button>
      </div>

      {/* AI Isolation Forest Explanation Banner */}
      <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-2xl flex items-start gap-3">
        <Brain className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-cyan-300 block">AI Component: Isolation Forest Anomaly Detection</span>
          <p className="text-slate-300 leading-relaxed">
            The AI engine flags unusual feeder load deviations from normal diurnal baseline ranges (e.g. flagging Feeder F02 spiking to 4.8 MW when typical normal is 2.5–3.5 MW).
            <span className="text-emerald-400 font-medium ml-1">
              Important: AI acts purely as decision support to alert operators; automated load shedding decisions are governed by deterministic MILP optimization.
            </span>
          </p>
        </div>
      </div>

      {/* Active Alerts Categorized List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overloads & Shortages */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              Feeder Overloads & Grid Shortages
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              {overloads.length + shortages.length} Critical
            </span>
          </h3>

          {overloads.length + shortages.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
              <p>No feeder overloads or supply deficits currently detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...shortages, ...overloads].map((a) => (
                <div key={a.id} className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{a.title}</span>
                    <span className="font-mono text-[10px]">{a.feeder_id}</span>
                  </div>
                  <p className="font-mono text-[11px] text-rose-300">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Machine Learning Anomalies */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-amber-400">
              <Brain className="w-4 h-4" />
              AI Isolation Forest Detections
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {anomalies.length} Flagged
            </span>
          </h3>

          {anomalies.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
              <p>Feeder telemetry is within expected statistical distribution bounds.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map((a) => (
                <div key={a.id} className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{a.title}</span>
                    <span className="font-mono text-[10px]">{a.feeder_id}</span>
                  </div>
                  <p className="font-mono text-[11px] text-amber-300">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
