import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DataSetupView } from './components/DataSetupView';
import { GridView } from './components/GridView';
import { FeederDetailView } from './components/FeederDetailView';
import { SimulationView } from './components/SimulationView';
import { AlertsView } from './components/AlertsView';
import { OptimizationView } from './components/OptimizationView';
import { OutageEquityView } from './components/OutageEquityView';
import { ScenariosView } from './components/ScenariosView';
import { AnalyticsView } from './components/AnalyticsView';
import { EventHistoryView } from './components/EventHistoryView';
import { ArchitectureView } from './components/ArchitectureView';
import { useGridTelemetry } from './hooks/useGridTelemetry';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const {
    status,
    feeders,
    alerts,
    recommendations,
    outages,
    refreshAll,
    controlSimulation,
    loadDemoGrid,
    runOptimization,
    approvePlan,
    rejectPlan,
    injectEvent,
    runScenario,
  } = useGridTelemetry(2500);

  const handleOptimization = async () => {
    await runOptimization('Operator triggered MILP optimization');
    setActiveTab('optimization');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        onControlSimulation={controlSimulation}
        onLoadDemo={loadDemoGrid}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            status={status}
            feeders={feeders}
            alerts={alerts}
            recommendations={recommendations}
            outages={outages}
            onNavigate={(tab) => setActiveTab(tab)}
            onRunOptimization={handleOptimization}
            onInjectEvent={injectEvent}
          />
        )}

        {activeTab === 'setup' && (
          <DataSetupView
            onGridCreated={() => {
              refreshAll();
              setActiveTab('dashboard');
            }}
            onLoadDemo={loadDemoGrid}
          />
        )}

        {activeTab === 'grid-view' && <GridView />}

        {activeTab === 'feeder-details' && <FeederDetailView />}

        {activeTab === 'simulation' && (
          <SimulationView
            status={status}
            feeders={feeders}
            onControl={controlSimulation}
            onInjectEvent={injectEvent}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView alerts={alerts} onRunOptimization={handleOptimization} />
        )}

        {activeTab === 'optimization' && (
          <OptimizationView
            recommendations={recommendations}
            onRunOptimization={handleOptimization}
            onApprove={approvePlan}
            onReject={rejectPlan}
          />
        )}

        {activeTab === 'equity' && <OutageEquityView />}

        {activeTab === 'scenarios' && (
          <ScenariosView
            activeScenarioName={status?.active_scenario || 'Normal'}
            onScenarioRun={runScenario}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'history' && <EventHistoryView />}

        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          GridSmart — Rural Feeder Decision Support & Load Management System.
          <span className="text-emerald-400 font-mono ml-1.5 font-semibold">
            Data Source: {status?.data_source || 'Demo Simulation'}
          </span>
        </p>
      </footer>
    </div>
  );
};

export default App;
