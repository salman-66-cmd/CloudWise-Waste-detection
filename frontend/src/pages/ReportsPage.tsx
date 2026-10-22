import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  TrendingDown,
  PieChart as PieIcon,
  ShieldAlert,
  Server
} from 'lucide-react';
import { reportsApi } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await reportsApi.getSummary();
        setReport(data);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleExportCsv = () => {
    window.open('/api/reports/export', '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:text-black print:bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b] print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Cloud Waste & Optimization Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Executive audit summaries, multi-cloud cost benchmarks, and waste distribution breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111726] border border-[#1e293b] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report CSV</span>
          </button>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="p-6 rounded-2xl bg-linear-to-br from-[#111726] via-[#141d33] to-[#0d1322] border border-blue-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-[#1e293b] pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-blue-400">
              AUDIT CERTIFICATE & EXECUTIVE SUMMARY
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Cloud Infrastructure Optimization Statement
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Generated: {report?.generated_at ? new Date(report.generated_at).toLocaleDateString() : 'Today'}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-[#090d16]/70 border border-[#1e293b]">
            <div className="text-[11px] text-slate-400">Monitored Assets</div>
            <div className="text-xl font-bold text-white mt-1">{report?.total_resources || 0}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#090d16]/70 border border-[#1e293b]">
            <div className="text-[11px] text-slate-400">Monthly Run Rate</div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              ${(report?.total_monthly_spend || 0).toFixed(2)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#090d16]/70 border border-[#1e293b]">
            <div className="text-[11px] text-slate-400">Potential Monthly Savings</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              ${(report?.total_potential_monthly_savings || 0).toFixed(2)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#090d16]/70 border border-[#1e293b]">
            <div className="text-[11px] text-slate-400">Fleet Efficiency Score</div>
            <div className="text-xl font-bold text-blue-400 mt-1">
              {(report?.optimization_score || 0).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Findings by Category & Environment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Waste Findings by Category */}
        <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Waste Findings by Heuristic Category</span>
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {report?.findings_by_category && Object.keys(report.findings_by_category).length > 0 ? (
              Object.entries(report.findings_by_category).map(([cat, count]: [string, any]) => (
                <div key={cat} className="p-3 rounded-lg bg-[#0d1322] border border-[#1e293b] flex justify-between items-center text-slate-300">
                  <span className="font-medium">{cat}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                    {count} Flagged
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500">No category findings recorded</div>
            )}
          </div>
        </div>

        {/* Environment Cost Breakdown */}
        <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <span>Spend by Lifecycle Environment</span>
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {report?.environment_breakdown?.map((env: any) => (
              <div key={env.environment} className="p-3 rounded-lg bg-[#0d1322] border border-[#1e293b] flex justify-between items-center text-slate-300">
                <div>
                  <span className="font-semibold text-white">{env.environment}</span>
                  <span className="text-[11px] text-slate-500 ml-2">({env.resource_count} assets)</span>
                </div>
                <span className="font-bold font-mono text-slate-200">
                  ${env.monthly_spend.toFixed(2)}/mo
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 Executive Recommendations Table */}
      <div className="rounded-xl bg-[#111726] border border-[#1e293b] p-6">
        <h3 className="text-base font-bold text-white tracking-tight mb-4">
          Prioritized Optimization Action Roadmap
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Recommendation</th>
                <th className="py-3 px-3">Suggested Action</th>
                <th className="py-3 px-3">Monthly Savings</th>
                <th className="py-3 px-3">Risk Tier</th>
                <th className="py-3 px-3">Workflow State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50">
              {report?.recommendations_summary?.map((rec: any, idx: number) => (
                <tr key={idx} className="hover:bg-[#151d30]/60">
                  <td className="py-3 px-3 font-semibold text-slate-200">{rec.title}</td>
                  <td className="py-3 px-3 text-slate-300">{rec.action}</td>
                  <td className="py-3 px-3 font-bold text-emerald-400 font-mono">${rec.savings.toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-500/20 bg-blue-500/10 text-blue-400">
                      {rec.risk}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{rec.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
