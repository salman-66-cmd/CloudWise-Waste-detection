import React, { useState, useEffect } from 'react';
import {
  Server,
  DollarSign,
  TrendingDown,
  Activity,
  AlertTriangle,
  Cpu,
  Layers,
  Filter,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Zap,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { dashboardApi } from '../services/api';
import type { DashboardSummary } from '../types';
import { StatCard } from '../components/StatCard';
import { CardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const summary = await dashboardApi.getSummary({
        provider: providerFilter,
        environment: envFilter
      });
      setData(summary);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [providerFilter, envFilter]);

  const PIE_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#64748b'];

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton height="h-80" /></div>
          <div><ChartSkeleton height="h-80" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Welcome & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back. Real-time telemetry, waste detection findings, and cost analytics.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Provider Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111726] border border-[#1e293b] text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-[#111726]">All Providers</option>
              <option value="AWS" className="bg-[#111726]">AWS</option>
              <option value="GCP" className="bg-[#111726]">GCP</option>
              <option value="Azure" className="bg-[#111726]">Azure</option>
              <option value="Simulated" className="bg-[#111726]">Simulated</option>
            </select>
          </div>

          {/* Environment Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111726] border border-[#1e293b] text-xs">
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-[#111726]">All Environments</option>
              <option value="Production" className="bg-[#111726]">Production</option>
              <option value="Staging" className="bg-[#111726]">Staging</option>
              <option value="Development" className="bg-[#111726]">Development</option>
              <option value="Testing" className="bg-[#111726]">Testing</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-[#111726] border border-[#1e293b] hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Instances"
          value={data?.active_resources || 0}
          icon={Server}
          badgeText="↗ Running"
          badgeColor="blue"
          subtext={`Out of ${data?.total_resources || 0} total managed assets`}
        />
        <StatCard
          title="Est. Monthly Savings"
          value={`$${(data?.potential_monthly_savings || 0).toFixed(2)}`}
          icon={DollarSign}
          badgeText="↗ Identifiable"
          badgeColor="emerald"
          subtext={`$${(data?.potential_annual_savings || 0).toFixed(0)} potential annually`}
        />
        <StatCard
          title="Idle / Wasteful Assets"
          value={data?.idle_resources || 0}
          icon={AlertTriangle}
          badgeText={data?.idle_resources ? 'Action needed' : 'Clean'}
          badgeColor={data?.idle_resources ? 'rose' : 'emerald'}
          subtext={`${data?.underutilized_resources || 0} underutilized items`}
        />
        <StatCard
          title="System Optimization Score"
          value={`${data?.optimization_score || 0}%`}
          icon={Activity}
          badgeText="↗ Stable"
          badgeColor="purple"
          subtext={`Monthly Spend: $${(data?.estimated_monthly_cost || 0).toFixed(2)}`}
        />
      </div>

      {/* Charts Row: Savings Trend & Recent Actions (Direct visual match to screenshot!) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Savings Trend Bar Chart */}
        <div className="lg:col-span-2 rounded-xl bg-[#111726] border border-[#1e293b] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Savings & Spend Trend</h3>
              <p className="text-xs text-slate-400">Daily cost and avoidable reduction telemetry</p>
            </div>
            <div className="text-xs text-slate-400 bg-[#090d16] px-2.5 py-1 rounded-md border border-[#1e293b]">
              Last 7 Days
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: any) => [`$${value}`, 'Daily Cost']}
                />
                <Bar dataKey="spend" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Recent Actions / Automated System Events */}
        <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white tracking-tight">Recent Actions</h3>
            <p className="text-xs text-slate-400">Automated system events & recommendations</p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
            {data?.recent_recommendations && data.recent_recommendations.length > 0 ? (
              data.recent_recommendations.slice(0, 4).map((rec) => (
                <div
                  key={rec.recommendation_id}
                  className="p-3 rounded-lg bg-[#0d1322] border border-[#1e293b] flex items-center justify-between hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-200 truncate">{rec.title}</div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <span>{rec.resource_id}</span>
                        <span>•</span>
                        <Clock className="w-2.5 h-2.5" />
                        <span>Recent</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-xs font-bold text-emerald-400">
                      +${(rec.estimated_monthly_savings / 730).toFixed(2)}/h
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500">SAVINGS</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No recent actions recorded. Click "Detect Waste" to analyze.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Utilization Trends & Distribution Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Utilization Trend */}
        <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Fleet Utilization Trend</h3>
              <p className="text-xs text-slate-400">Average CPU and Memory percentage over time</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> CPU %
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Memory %
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Distribution by Category */}
        <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Resource Inventory Breakdown</h3>
              <p className="text-xs text-slate-400">Composition across VM, DB, Storage, and Load Balancers</p>
            </div>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {data?.distribution_by_type && data.distribution_by_type.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution_by_type}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.distribution_by_type.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No inventory data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Wasteful Resources Table */}
      <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Top Wasteful Cloud Resources</h3>
            <p className="text-xs text-slate-400">Assets consuming budget with lowest utilization density</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
            High Priority
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Resource Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Provider</th>
                <th className="py-3 px-3">Environment</th>
                <th className="py-3 px-3">Waste Category</th>
                <th className="py-3 px-3">Monthly Cost</th>
                <th className="py-3 px-3">Potential Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50">
              {data?.top_wasteful_resources && data.top_wasteful_resources.length > 0 ? (
                data.top_wasteful_resources.map((item) => (
                  <tr key={item.resource_id} className="hover:bg-[#151d30]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.resource_id}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{item.resource_type}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        {item.provider}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{item.environment}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        {item.reason}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-mono">${item.monthly_cost.toFixed(2)}</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400 font-mono">
                      ${item.potential_savings.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No wasteful resources flagged. Infrastructure is operating optimally!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
