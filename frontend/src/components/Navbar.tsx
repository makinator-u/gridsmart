import React from 'react';
import {
  Zap,
  LayoutDashboard,
  Sliders,
  Network,
  Activity,
  Play,
  Pause,
  AlertTriangle,
  Brain,
  Scale,
  Compass,
  BarChart3,
  History,
  Info,
  RefreshCw,
} from 'lucide-react';
import type { GridStatus } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: GridStatus | null;
  onControlSimulation: (action: 'start' | 'pause' | 'reset', speed?: number) => void;
  onLoadDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  status,
  onControlSimulation,
  onLoadDemo,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grid-view', label: 'Grid Topology', icon: Network },
    { id: 'feeder-details', label: 'Feeder Telemetry', icon: Activity },
    { id: 'simulation', label: 'Simulation & Events', icon: Play },
    { id: 'alerts', label: 'Alerts & AI', icon: AlertTriangle },
    { id: 'optimization', label: 'Optimization & Plan', icon: Brain },
    { id: 'equity', label: 'Outage Equity', icon: Scale },
    { id: 'scenarios', label: 'Scenarios', icon: Compass },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'Event History', icon: History },
    { id: 'setup', label: 'Data & CSV Setup', icon: Sliders },
    { id: 'architecture', label: 'How It Works', icon: Info },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/20 text-slate-950">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">GridSmart</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Decision Support
              </span>
            </div>
            <p className="text-xs text-slate-400">Rural Feeder Decision Support & Load Management System</p>
          </div>
        </div>

        {/* Data Source & Simulation Status Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Data Source Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Data Source:</span>
            <span className="text-emerald-400 font-semibold">{status?.data_source || 'Demo Simulation'}</span>
          </div>

          {/* Time & Simulation Speed Controls */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1 text-xs">
            <span className="text-slate-400 font-mono">Time:</span>
            <span className="font-mono text-emerald-300 text-sm font-bold">
              {status?.simulation_time || '14:35'}
            </span>

            <button
              onClick={() => onControlSimulation(status?.is_running ? 'pause' : 'start')}
              className={`p-1 rounded transition-colors ${
                status?.is_running ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
              title={status?.is_running ? 'Pause Simulation' : 'Start Simulation'}
            >
              {status?.is_running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
              {[1, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => onControlSimulation('start', s)}
                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                    status?.speed_multiplier === s
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Quick Demo Load */}
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Demo Grid</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
