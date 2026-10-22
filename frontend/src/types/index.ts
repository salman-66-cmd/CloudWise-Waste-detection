export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: 'admin' | 'standard';
  is_active: boolean;
  created_at: string;
}

export interface CloudResource {
  id: number;
  resource_id: string;
  name: string;
  provider: string;
  region: string;
  resource_type: string;
  environment: string;
  instance_size: string;
  cpu_utilization: number;
  memory_utilization: number | null;
  network_utilization: number;
  storage_utilization: number | null;
  hourly_cost: number;
  monthly_cost: number;
  status: string;
  is_attached: boolean;
  optimization_status: string;
  source: string;
  created_at: string;
  last_activity: string;
  last_metrics_update: string;
  tags?: string;
}

export interface WasteFinding {
  id: number;
  finding_id: string;
  resource_id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule_triggered: string;
  observed_metrics: string;
  explanation: string;
  estimated_monthly_savings: number;
  confidence_level: 'High' | 'Medium' | 'Low';
  suggested_next_step: string;
  detection_timestamp: string;
  review_status: 'new' | 'acknowledged' | 'resolved' | 'dismissed';
}

export interface Recommendation {
  id: number;
  recommendation_id: string;
  resource_id: string;
  finding_id: string | null;
  title: string;
  suggested_action: string;
  current_configuration: string;
  evidence: string;
  estimated_monthly_savings: number;
  estimated_savings_range?: string;
  risk_level: 'Low' | 'Medium' | 'High';
  confidence_level: 'High' | 'Medium' | 'Low';
  operational_impact: string;
  required_human_approval: boolean;
  rollback_considerations: string;
  status: 'New' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  resource_id?: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  is_read: boolean;
  status: 'active' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
}

export interface DashboardSummary {
  total_resources: number;
  active_resources: number;
  idle_resources: number;
  underutilized_resources: number;
  estimated_monthly_cost: number;
  potential_monthly_savings: number;
  potential_annual_savings: number;
  optimization_score: number;
  simulated_count: number;
  aws_count: number;
  top_wasteful_resources: Array<{
    resource_id: string;
    name: string;
    resource_type: string;
    provider: string;
    environment: string;
    monthly_cost: number;
    potential_savings: number;
    reason: string;
    severity: string;
  }>;
  recent_alerts: Alert[];
  recent_recommendations: Recommendation[];
  distribution_by_type: Array<{ name: string; count: number; cost: number }>;
  distribution_by_provider: Array<{ name: string; count: number; cost: number }>;
  idle_vs_active: Array<{ name: string; value: number }>;
  trends: Array<{
    time: string;
    cpu: number;
    memory: number;
    spend: number;
  }>;
}

export interface SystemSettings {
  idle_cpu_threshold: number;
  underutilized_cpu_threshold: number;
  low_memory_threshold: number;
  unattached_storage_days: number;
  low_traffic_lb_mbps: number;
  stale_resource_days: number;
  monthly_billable_hours: number;
  observation_window_days: number;
  min_metrics_count: number;
  aws_enabled: boolean;
}
