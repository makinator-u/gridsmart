import React, { useState, useEffect } from 'react';
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
import { api } from './api/client';
import type { GridStatus, FeederItem, GridAlert, OptimizationRun, OutageBalance } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [status, setStatus] = useState<GridStatus | null>(null);
  const [feeders, setFeeders] = useState<FeederItem[]>([]);
  const [alerts, setAlerts] = useState<GridAlert[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRun | null>(null);
  const [outages, setOutages] = useState<OutageBalance | null>(null);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchLiveTelemetry, 2500);
    return () => clearInterval(interval);
  }, []);

  // Full refresh (on load or after actions)
  const fetchAllData = async () => {
    try {
      const [st, fList, alRes, recRes, outRes] = await Promise.all([
        api.getGridStatus(),
        api.getFeeders(),
        api.getAlerts(),
        api.getRecommendations(),
        api.getOutages(),
      ]);
      setStatus(st);
      setFeeders(fList);
      setAlerts(alRes.alerts || []);
      setRecommendations(recRes);
      setOutages(outRes);
    } catch (err) {
      console.error('Error fetching grid state:', err);
    }
  };

  // Lightweight 2.5s telemetry poll (prevents DB lock contention)
  const fetchLiveTelemetry = async () => {
    try {
      const [st, fList, alRes] = await Promise.all([
        api.getGridStatus(),
        api.getFeeders(),
        api.getAlerts(),
      ]);
      setStatus(st);
      setFeeders(fList);
      setAlerts(alRes.alerts || []);
    } catch (err) {
      console.error('Error polling telemetry:', err);
    }
  };

  const handleControlSimulation = async (action: 'start' | 'pause' | 'reset', speed?: number) => {
    try {
      await api.controlSimulation(action, speed);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadDemo = async () => {
    try {
      await api.loadDemoGrid();
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunOptimization = async () => {
    try {
      const run = await api.runOptimization("Operator triggered MILP optimization");
      setRecommendations(run);
      setActiveTab('optimization');
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovePlan = async (optId: number) => {
    try {
      await api.approvePlan(optId);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPlan = async (optId: number) => {
    try {
      await api.rejectPlan(optId);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInjectEvent = async (eventType: string, feederCode?: string, magnitudeMw?: number) => {
    try {
      await api.injectEvent(eventType, feederCode, magnitudeMw);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunScenario = async (scenarioName: string) => {
    try {
      await api.runScenario(scenarioName);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        onControlSimulation={handleControlSimulation}
        onLoadDemo={handleLoadDemo}
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
            onRunOptimization={handleRunOptimization}
            onInjectEvent={handleInjectEvent}
          />
        )}

        {activeTab === 'setup' && (
          <DataSetupView
            onGridCreated={() => {
              fetchAllData();
              setActiveTab('dashboard');
            }}
            onLoadDemo={handleLoadDemo}
          />
        )}

        {activeTab === 'grid-view' && <GridView />}

        {activeTab === 'feeder-details' && <FeederDetailView />}

        {activeTab === 'simulation' && (
          <SimulationView
            status={status}
            feeders={feeders}
            onControl={handleControlSimulation}
            onInjectEvent={handleInjectEvent}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView alerts={alerts} onRunOptimization={handleRunOptimization} />
        )}

        {activeTab === 'optimization' && (
          <OptimizationView
            recommendations={recommendations}
            onRunOptimization={handleRunOptimization}
            onApprove={handleApprovePlan}
            onReject={handleRejectPlan}
          />
        )}

        {activeTab === 'equity' && <OutageEquityView />}

        {activeTab === 'scenarios' && (
          <ScenariosView
            activeScenarioName={status?.active_scenario || 'Normal'}
            onScenarioRun={handleRunScenario}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'history' && <EventHistoryView />}

        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          GridSmart — Rural Feeder Decision Support & Load Management System.
          <span className="text-emerald-400 font-mono ml-1.5 font-semibold">Data Source: {status?.data_source || 'Demo Simulation'}</span>
        </p>
      </footer>
    </div>
  );
};

export default App;

