export interface GridStatus {
  total_feeders: number;
  normal_feeders: number;
  warning_feeders: number;
  overloaded_feeders: number;
  offline_feeders: number;
  maintenance_feeders: number;
  total_demand_mw: number;
  available_power_mw: number;
  current_shortage_mw: number;
  critical_load_mw: number;
  flexible_load_mw: number;
  current_outages_count: number;
  data_source: string;
  simulation_time: string;
  active_scenario: string;
  is_running: boolean;
  speed_multiplier: number;
}

export interface FeederItem {
  id: number;
  feeder_id: string;
  feeder_name: string;
  capacity_mw: number;
  current_load_mw: number;
  loading_pct: number;
  status: 'NORMAL' | 'HIGH_LOADING' | 'OVERLOADED' | 'OFFLINE' | 'MAINTENANCE';
  villages: { id: number; name: string; outage_hours: number }[];
  consumer_groups: ConsumerGroupItem[];
}

export interface ConsumerGroupItem {
  id: number;
  type: string;
  power_mw: number;
  priority: number;
  is_critical: boolean;
}

export interface NetworkTree {
  substation: {
    name: string;
    capacity_mw: number;
    available_power_mw: number;
    voltage_level_kv: number;
  } | null;
  feeders: {
    id: number;
    code: string;
    name: string;
    capacity_mw: number;
    current_load_mw: number;
    loading_pct: number;
    status: string;
    villages: string[];
    critical_load_mw: number;
    flexible_load_mw: number;
  }[];
}

export interface RecommendedAction {
  id: number;
  feeder_code: string;
  consumer_group_name: string;
  action: 'REDUCE' | 'SHIFT' | 'DELAY' | 'RESTORE' | 'KEEP_ON';
  load_mw: number;
  duration_mins: number;
  status: 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
}

export interface OptimizationRun {
  optimization_id: number;
  timestamp: string;
  total_demand_mw: number;
  available_power_mw: number;
  shortage_mw: number;
  status: string;
  recommended_actions: RecommendedAction[];
}

export interface GridAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: string;
  title: string;
  message: string;
  feeder_id: string;
}

export interface GridEventLog {
  id: number;
  timestamp: string;
  event_type: string;
  feeder_id: number | null;
  description: string;
  severity: string;
}

export interface ScenarioItem {
  name: string;
  description: string;
  agri_delta_pct: number;
  gen_delta_mw: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface OutageBalance {
  total_active_outages: number;
  village_outage_balance: {
    village_name: string;
    feeder_code: string;
    outage_hours_today: number;
    consumer_count: number;
    equity_status: string;
  }[];
  active_outage_records: {
    id: number;
    feeder_id: number;
    village_name: string;
    reason: string;
    duration_hours: number;
    start_time: string;
  }[];
}
