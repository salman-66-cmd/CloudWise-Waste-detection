import axios from 'axios';
import type {
  User,
  CloudResource,
  WasteFinding,
  Recommendation,
  Alert,
  DashboardSummary,
  SystemSettings
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloudwise_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthenticated and not on auth pages, could redirect
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: { email: string; password: string; full_name?: string; role?: string }) => {
    const res = await api.post<User>('/auth/register', userData);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const dashboardApi = {
  getSummary: async (params?: { provider?: string; environment?: string }) => {
    const res = await api.get<DashboardSummary>('/dashboard/summary', { params });
    return res.data;
  },
  getTrends: async (days: number = 7) => {
    const res = await api.get<Array<{ time: string; cpu: number; memory: number; spend: number }>>('/dashboard/trends', { params: { days } });
    return res.data;
  },
};

export const resourcesApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    provider?: string;
    resource_type?: string;
    environment?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_desc?: boolean;
  }) => {
    const res = await api.get<{ total: number; page: number; page_size: number; items: CloudResource[] }>('/resources', { params });
    return res.data;
  },
  get: async (resourceId: string) => {
    const res = await api.get<CloudResource>(`/resources/${resourceId}`);
    return res.data;
  },
  create: async (data: Partial<CloudResource>) => {
    const res = await api.post<CloudResource>('/resources', data);
    return res.data;
  },
  update: async (resourceId: string, data: Partial<CloudResource>) => {
    const res = await api.patch<CloudResource>(`/resources/${resourceId}`, data);
    return res.data;
  },
  delete: async (resourceId: string) => {
    const res = await api.delete<{ status: string; message: string }>(`/resources/${resourceId}`);
    return res.data;
  },
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ processed: number; errors: number }>('/resources/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const analysisApi = {
  runAnalysis: async () => {
    const res = await api.post<{ job_id: string; findings_generated: number; potential_savings: number }>('/analysis/run');
    return res.data;
  },
  getFindings: async (params?: { category?: string; severity?: string; review_status?: string }) => {
    const res = await api.get<WasteFinding[]>('/analysis/findings', { params });
    return res.data;
  },
  updateStatus: async (findingId: string, status: string) => {
    const res = await api.patch<WasteFinding>(`/analysis/findings/${findingId}`, { review_status: status });
    return res.data;
  },
};

export const recommendationsApi = {
  list: async (params?: { status?: string; risk_level?: string }) => {
    const res = await api.get<Recommendation[]>('/recommendations', { params });
    return res.data;
  },
  updateStatus: async (recId: string, status: string, notes?: string) => {
    const res = await api.patch<Recommendation>(`/recommendations/${recId}`, { status, review_notes: notes });
    return res.data;
  },
};

export const alertsApi = {
  list: async (params?: { severity?: string; is_read?: boolean; status?: string }) => {
    const res = await api.get<Alert[]>('/alerts', { params });
    return res.data;
  },
  update: async (alertId: string, data: { is_read?: boolean; status?: string }) => {
    const res = await api.patch<Alert>(`/alerts/${alertId}`, data);
    return res.data;
  },
};

export const reportsApi = {
  getSummary: async () => {
    const res = await api.get<any>('/reports/summary');
    return res.data;
  },
};

export const settingsApi = {
  getSettings: async () => {
    const res = await api.get<SystemSettings>('/settings');
    return res.data;
  },
  updateSettings: async (data: Partial<SystemSettings>) => {
    const res = await api.patch<SystemSettings>('/settings', data);
    return res.data;
  },
  getAwsStatus: async () => {
    const res = await api.get<{ configured: boolean; region: string; enabled: boolean; mode: string; message: string }>('/settings/aws/status');
    return res.data;
  },
  syncAws: async () => {
    const res = await api.post<{ success: boolean; message?: string; error?: string; imported_count: number }>('/settings/aws/sync');
    return res.data;
  },
};

export const simulatorApi = {
  run: async (forceReset: boolean = false) => {
    const res = await api.post<any>(`/metrics/simulator/run?force_reset=${forceReset}`);
    return res.data;
  },
};

export default api;
