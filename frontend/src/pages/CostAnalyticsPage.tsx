import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  PieChart as PieIcon,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { dashboardApi } from '../services/api';
import type { DashboardSummary } from '../types';
import { StatCard } from '../components/StatCard';

export const CostAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const summary = await dashboardApi.getSummary();
        setData(summary);
      } catch (err) {
        console.error('Failed to load cost data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const PIE_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#64748b'];

  const monthlyCost = data?.estimated_monthly_cost || 0;
  const potentialSavings = data?.potential_monthly_savings || 0;
  const optimizedCost = Math.max(0, monthlyCost - potentialSavings);
  const annualSavings = potentialSavings * 12;
  const hourlyCost = monthlyCost / 730;
  const dailyCost = hourlyCost * 24;

  const comparisonData = [
    { name: 'Current Spend', amount: monthlyCost, fill: '#3b82f6' },
    { name: 'Optimized Target', amount: optimizedCost, fill: '#10b981' },
    { name: 'Net Savings', amount: potentialSavings, fill: '#06b6d4' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Cloud Cost Analytics & Forecasting
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard baseline calculations across 730 billable continuous hours/month.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>730 Hours Monthly Rate Standard</span>
        </div>
      </div>

      {/* Primary Cost Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Monthly Run Rate"
          value={`$${monthlyCost.toFixed(2)}`}
          icon={DollarSign}
          badgeText="Active Fleet"
          badgeColor="blue"
          subtext={`$${dailyCost.toFixed(2)}/day • $${hourlyCost.toFixed(4)}/hr`}
        />
        <StatCard
          title="Potential Monthly Savings"
          value={`$${potentialSavings.toFixed(2)}`}
          icon={TrendingDown}
          badgeText="Avoidable"
          badgeColor="emerald"
          subtext={`${monthlyCost > 0 ? ((potentialSavings / monthlyCost) * 100).toFixed(1) : 0}% of total bill`}
        />
        <StatCard
          title="Target Post-Optimization"
          value={`$${optimizedCost.toFixed(2)}`}
          icon={Sparkles}
          badgeText="Optimized"
          badgeColor="purple"
          subtext="After rightsizing and idle stops"
        />
        <StatCard
          title="Projected Annual Savings"
          value={`$${annualSavings.toFixed(0)}`}
          icon={ShieldCheck}
          badgeText="12 Months"
          badgeColor="emerald"
          subtext="Cumulative yearly retention"
        />
      </div>

      {/* Before-and-After Comparison & Provider Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Before-and-After Optimization Comparison Chart */}
        <div className="lg:col-span-2 rounded-xl bg-[#111726] border border-[#1e293b] p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white tracking-tight">Before vs After Optimization Projection</h3>
            <p className="text-xs text-slate-400">Comparison of current fleet overhead vs optimized baseline</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Provider Spend Allocation */}
        <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Spend by Cloud Provider</h3>
            <p className="text-xs text-slate-400">AWS, GCP, Azure, and simulated environment share</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {data?.distribution_by_provider && data.distribution_by_provider.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution_by_provider}
                    dataKey="cost"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {data.distribution_by_provider.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`$${val}`, 'Monthly Spend']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No spend breakdown</div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#1e293b] text-xs">
            {data?.distribution_by_provider?.map((p, idx) => (
              <div key={p.name} className="flex justify-between items-center text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span>{p.name}</span>
                </div>
                <span className="font-mono font-bold">${p.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avoidable Savings Methodology Banner */}
      <div className="p-5 rounded-xl bg-linear-to-r from-blue-950/40 via-indigo-950/20 to-[#111726] border border-blue-500/20 text-xs space-y-2">
        <div className="text-sm font-bold text-blue-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>Non-Destructive Optimization Formula</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Savings estimates are derived strictly from the avoidable portion of resource fees: 100% for detached unattached EBS storage, 100% for idle development instances decommissioned or stopped outside work hours, and 45% conservative savings for rightsizing over-provisioned virtual machine and database compute. Overlapping findings on the same asset are deduplicated to ensure budgeting realism.
        </p>
      </div>
    </div>
  );
};
