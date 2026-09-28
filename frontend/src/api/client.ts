import axios from 'axios';
import type {
  GridStatus,
  FeederItem,
  NetworkTree,
  OptimizationRun,
  GridAlert,
  GridEventLog,
  ScenarioItem,
  OutageBalance,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Grid Status & Controls
  getGridStatus: async (): Promise<GridStatus> => {
    const res = await axios.get(`${API_BASE}/grid/status`);
    return res.data;
  },

  loadDemoGrid: async (): Promise<any> => {
    const res = await axios.post(`${API_BASE}/grid/demo`);
    return res.data;
  },

  createManualGrid: async (payload: any): Promise<any> => {
    const res = await axios.post(`${API_BASE}/grid/create`, payload);
    return res.data;
  },

  // Feeders
  getFeeders: async (): Promise<FeederItem[]> => {
    const res = await axios.get(`${API_BASE}/feeders`);
    return res.data;
  },

  getNetworkTree: async (): Promise<NetworkTree> => {
    const res = await axios.get(`${API_BASE}/feeders/tree`);
    return res.data;
  },

  getFeederDetail: async (id: string): Promise<any> => {
    const res = await axios.get(`${API_BASE}/feeders/${id}`);
    return res.data;
  },

  // Simulation
  getSimState: async (): Promise<any> => {
    const res = await axios.get(`${API_BASE}/simulation/state`);
    return res.data;
  },

  controlSimulation: async (action: 'start' | 'pause' | 'reset', speed?: number): Promise<any> => {
    const res = await axios.post(`${API_BASE}/simulation/control`, { action, speed });
    return res.data;
  },

  triggerTick: async (): Promise<any> => {
    const res = await axios.post(`${API_BASE}/simulation/tick`);
    return res.data;
  },

  injectEvent: async (eventType: string, feederCode?: string, magnitudeMw?: number): Promise<any> => {
    const res = await axios.post(`${API_BASE}/simulation/inject`, {
      event_type: eventType,
      feeder_code: feederCode,
      magnitude_mw: magnitudeMw,
    });
    return res.data;
  },

  // Alerts & Events
  getAlerts: async (): Promise<{ count: number; alerts: GridAlert[] }> => {
    const res = await axios.get(`${API_BASE}/alerts`);
    return res.data;
  },

  getEvents: async (limit: number = 50): Promise<GridEventLog[]> => {
    const res = await axios.get(`${API_BASE}/events?limit=${limit}`);
    return res.data;
  },

  // Optimization & Operator Plan
  runOptimization: async (notes?: string): Promise<OptimizationRun> => {
    const res = await axios.post(`${API_BASE}/optimization/run`, { notes });
    return res.data;
  },

  getRecommendations: async (): Promise<OptimizationRun> => {
    const res = await axios.get(`${API_BASE}/recommendations`);
    return res.data;
  },

  approvePlan: async (optId: number): Promise<any> => {
    const res = await axios.post(`${API_BASE}/recommendations/${optId}/approve`);
    return res.data;
  },

  rejectPlan: async (optId: number): Promise<any> => {
    const res = await axios.post(`${API_BASE}/recommendations/${optId}/reject`);
    return res.data;
  },

  // Scenarios
  getScenarios: async (): Promise<ScenarioItem[]> => {
    const res = await axios.get(`${API_BASE}/scenarios`);
    return res.data;
  },

  runScenario: async (scenarioName: string): Promise<any> => {
    const res = await axios.post(`${API_BASE}/scenarios/run`, { scenario_name: scenarioName });
    return res.data;
  },

  // Outage Equity & Analytics
  getOutages: async (): Promise<OutageBalance> => {
    const res = await axios.get(`${API_BASE}/data/outages`);
    return res.data;
  },

  getAnalytics: async (): Promise<any> => {
    const res = await axios.get(`${API_BASE}/data/analytics`);
    return res.data;
  },

  uploadCSV: async (feedersFile?: File, consumerFile?: File): Promise<any> => {
    const formData = new FormData();
    if (feedersFile) formData.append('feeders_file', feedersFile);
    if (consumerFile) formData.append('consumer_file', consumerFile);

    const res = await axios.post(`${API_BASE}/data/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
