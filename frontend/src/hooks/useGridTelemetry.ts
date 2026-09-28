import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { GridStatus, FeederItem, GridAlert, OptimizationRun, OutageBalance } from '../types';

export interface UseGridTelemetryReturn {
  status: GridStatus | null;
  feeders: FeederItem[];
  alerts: GridAlert[];
  recommendations: OptimizationRun | null;
  outages: OutageBalance | null;
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  controlSimulation: (action: 'start' | 'pause' | 'reset', speed?: number) => Promise<void>;
  loadDemoGrid: () => Promise<void>;
  runOptimization: (notes?: string) => Promise<OptimizationRun | null>;
  approvePlan: (id: number) => Promise<void>;
  rejectPlan: (id: number) => Promise<void>;
  injectEvent: (eventType: string, feederCode?: string, magnitudeMw?: number) => Promise<void>;
  runScenario: (scenarioName: string) => Promise<void>;
}

export const useGridTelemetry = (pollingIntervalMs: number = 2500): UseGridTelemetryReturn => {
  const [status, setStatus] = useState<GridStatus | null>(null);
  const [feeders, setFeeders] = useState<FeederItem[]>([]);
  const [alerts, setAlerts] = useState<GridAlert[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRun | null>(null);
  const [outages, setOutages] = useState<OutageBalance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Full state synchronization
  const refreshAll = useCallback(async () => {
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
      console.error('Failed to sync grid state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Lightweight periodic heartbeat
  const fetchHeartbeat = useCallback(async () => {
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
      console.error('Heartbeat telemetry error:', err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const timer = setInterval(fetchHeartbeat, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [refreshAll, fetchHeartbeat, pollingIntervalMs]);

  const controlSimulation = async (action: 'start' | 'pause' | 'reset', speed?: number) => {
    await api.controlSimulation(action, speed);
    await refreshAll();
  };

  const loadDemoGrid = async () => {
    await api.loadDemoGrid();
    await refreshAll();
  };

  const runOptimization = async (notes: string = 'Operator Triggered MILP'): Promise<OptimizationRun | null> => {
    try {
      const run = await api.runOptimization(notes);
      setRecommendations(run);
      await refreshAll();
      return run;
    } catch (err) {
      console.error('Optimization run failed:', err);
      return null;
    }
  };

  const approvePlan = async (id: number) => {
    await api.approvePlan(id);
    await refreshAll();
  };

  const rejectPlan = async (id: number) => {
    await api.rejectPlan(id);
    await refreshAll();
  };

  const injectEvent = async (eventType: string, feederCode?: string, magnitudeMw?: number) => {
    await api.injectEvent(eventType, feederCode, magnitudeMw);
    await refreshAll();
  };

  const runScenario = async (scenarioName: string) => {
    await api.runScenario(scenarioName);
    await refreshAll();
  };

  return {
    status,
    feeders,
    alerts,
    recommendations,
    outages,
    isLoading,
    refreshAll,
    controlSimulation,
    loadDemoGrid,
    runOptimization,
    approvePlan,
    rejectPlan,
    injectEvent,
    runScenario,
  };
};
