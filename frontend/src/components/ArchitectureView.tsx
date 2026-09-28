import React from 'react';
import { Info, Server, Brain, Scale, ShieldCheck, Cpu, Code } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-400" />
          <span>How GridSmart Works — System Architecture & Design Principles</span>
        </h2>
        <p className="text-xs text-slate-400">
          Complete breakdown of software architecture, mathematical algorithms, AI decision support boundaries, and future SCADA/AMI data source abstraction.
        </p>
      </div>

      {/* 5 Core Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Step 1: Data Abstraction */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
            <Server className="w-5 h-5" />
            <span>1. Data Source Abstraction</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The prototype uses simulated, manually configured, or CSV-uploaded grid data. The software architecture cleanly separates the data source interface (<code className="font-mono text-emerald-400">BaseDataSource</code>) from the monitoring and optimization engines. This allows future integration with SCADA (DNP3 / IEC 60870-5-104), AMI smart meters, or utility REST APIs without modifying the decision support system.
          </p>
        </div>

        {/* Step 2: Monitoring Engine */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm">
            <Cpu className="w-5 h-5" />
            <span>2. Rule-Based Monitoring Engine</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Continuously checks feeder loading against rated thermal capacity (<code className="font-mono text-cyan-300">Load &gt; Capacity</code>), total demand against available substation generation, and village outage durations to trigger instant operational alerts.
          </p>
        </div>

        {/* Step 3: AI Anomaly Detection */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <Brain className="w-5 h-5" />
            <span>3. AI Component: Isolation Forest</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Utilizes scikit-learn <code className="font-mono text-amber-300">IsolationForest</code> machine learning to detect unusual statistical load behavior (spikes, uncharacteristic off-peak draws). AI serves strictly as an anomaly detector for operator awareness and does not execute automated disconnects.
          </p>
        </div>

        {/* Step 4: MILP Optimization */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-indigo-400 text-sm">
            <Scale className="w-5 h-5" />
            <span>4. MILP Optimization Engine</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Uses Mixed-Integer Linear Programming (<code className="font-mono text-indigo-300">PuLP CBC</code>) to calculate safe and equitable load management plans. Objectives: (1) Protect Critical loads 100%, (2) Keep feeder loads within capacity limits, (3) Eliminate supply deficit, (4) Favor flexible loads (Agri/Comm), (5) Maintain village outage equity.
          </p>
        </div>
      </div>

      {/* Step 5: Operator Review */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>5. Human-in-the-Loop Operator Decision Support</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          The system operates purely as a decision support system. Optimization recommendations are presented to the operator with clear actions (<code className="font-mono text-emerald-400">REDUCE</code>, <code className="font-mono text-cyan-400">SHIFT</code>, <code className="font-mono text-amber-400">RESTORE</code>, <code className="font-mono text-indigo-400">KEEP ON</code>) and timeline visualizations. Control actions are only applied to the simulator grid state after explicit operator review and approval.
        </p>
      </div>

      {/* Architecture Diagram Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Code className="w-4 h-4 text-emerald-400" />
          <span>Data Source Abstraction Architecture</span>
        </h3>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre className="text-emerald-400 leading-relaxed">
{`                  ┌─────────────────────────────────────────┐
                  │             BaseDataSource              │
                  └────────────────────┬────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
  ┌─────────┴──────────┐     ┌─────────┴──────────┐     ┌─────────┴──────────┐
  │ SimulatorDataSource│     │    CSVDataSource   │     │FutureSCADADataSource│
  └─────────┬──────────┘     └─────────┬──────────┘     └─────────┬──────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       ▼
                       ┌──────────────────────────────┐
                       │  Monitoring & MILP Engine   │
                       └──────────────────────────────┘`}
          </pre>
        </div>
      </div>
    </div>
  );
};
