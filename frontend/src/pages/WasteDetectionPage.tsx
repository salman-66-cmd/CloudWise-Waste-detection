import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  Play,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  DollarSign
} from 'lucide-react';
import { analysisApi } from '../services/api';
import type { WasteFinding } from '../types';
import { Modal } from '../components/Modal';

export const WasteDetectionPage: React.FC = () => {
  const [findings, setFindings] = useState<WasteFinding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedFinding, setSelectedFinding] = useState<WasteFinding | null>(null);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const data = await analysisApi.getFindings({
        severity: severityFilter,
        category: categoryFilter,
        review_status: statusFilter
      });
      setFindings(data);
    } catch (err) {
      console.error('Failed to fetch findings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [severityFilter, categoryFilter, statusFilter]);

  const handleTriggerAnalysis = async () => {
    setIsScanning(true);
    try {
      await analysisApi.runAnalysis();
      fetchFindings();
    } catch (err) {
      alert('Waste detection failed to execute.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateStatus = async (findingId: string, newStatus: string) => {
    try {
      await analysisApi.updateStatus(findingId, newStatus);
      fetchFindings();
    } catch (err) {
      alert('Failed to update finding status.');
    }
  };

  const totalSavings = findings.reduce((acc, f) => acc + (f.review_status !== 'dismissed' ? f.estimated_monthly_savings : 0), 0);

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Cloud Waste Detection Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rule-based algorithmic heuristics analyzing telemetry, capacity limits, and idle patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Avoidable Waste Identified</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">${totalSavings.toFixed(2)}/mo</div>
          </div>
          <button
            onClick={handleTriggerAnalysis}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isScanning ? 'animate-spin' : 'fill-current'}`} />
            <span>{isScanning ? 'Running Engine...' : 'Run Waste Scan'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#111726] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-slate-300 outline-hidden"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-slate-300 outline-hidden"
          >
            <option value="all">All Categories</option>
            <option value="Idle Resource">Idle Compute</option>
            <option value="Underutilized Resource">Underutilized Compute</option>
            <option value="Low Memory Utilization">Low Memory</option>
            <option value="Unattached Storage">Unattached Storage</option>
            <option value="Oversized Database">Oversized Database</option>
            <option value="Low-Traffic Load Balancer">Low Traffic LB</option>
            <option value="Stale Resource">Stale Resource</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-slate-300 outline-hidden"
          >
            <option value="all">All Review States</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {findings.length > 0 ? (
          findings.map((f) => (
            <div
              key={f.finding_id}
              className="p-5 rounded-xl bg-[#111726] border border-[#1e293b] hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${severityBadge(f.severity)}`}>
                    {f.severity}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">{f.category}</span>
                  <span className="text-[11px] text-slate-500">• {f.rule_triggered}</span>
                  <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                    {f.resource_id}
                  </span>
                </div>

                <div className="text-sm font-semibold text-white tracking-tight">
                  {f.explanation}
                </div>

                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
                  <span>
                    Observed: <strong className="text-slate-300 font-mono">{f.observed_metrics}</strong>
                  </span>
                  <span>•</span>
                  <span>Confidence: <strong className="text-slate-300">{f.confidence_level}</strong></span>
                </div>
              </div>

              {/* Right Side: Savings & Action */}
              <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#1e293b] pt-3 md:pt-0 md:pl-6">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Potential Savings</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    ${f.estimated_monthly_savings.toFixed(2)}/mo
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={f.review_status}
                    onChange={(e) => handleUpdateStatus(f.finding_id, e.target.value)}
                    className="bg-[#090d16] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-hidden cursor-pointer"
                  >
                    <option value="new">New</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>

                  <button
                    onClick={() => setSelectedFinding(f)}
                    className="p-1.5 rounded-lg bg-[#090d16] border border-[#1e293b] hover:border-blue-500 text-slate-300 hover:text-white"
                    title="View Evidence Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-xl bg-[#111726] border border-[#1e293b] text-slate-400 text-xs">
            No waste findings match current filter criteria. Run a scan to discover optimization opportunities.
          </div>
        )}
      </div>

      {/* Finding Detail Evidence Modal */}
      <Modal
        isOpen={!!selectedFinding}
        onClose={() => setSelectedFinding(null)}
        title={selectedFinding ? `Finding Analysis: ${selectedFinding.finding_id}` : ''}
      >
        {selectedFinding && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] space-y-1">
              <div className="text-slate-400">Rule Triggered</div>
              <div className="text-sm font-bold text-white">{selectedFinding.rule_triggered}</div>
              <div className="text-slate-400 mt-2">Resource Under Evaluation</div>
              <div className="text-xs font-mono text-cyan-400">{selectedFinding.resource_id}</div>
            </div>

            <div>
              <div className="text-slate-400 font-semibold mb-1">Algorithmic Explanation</div>
              <p className="text-slate-200 leading-relaxed bg-[#0d1322] p-3 rounded-lg border border-[#1e293b]">
                {selectedFinding.explanation}
              </p>
            </div>

            <div>
              <div className="text-slate-400 font-semibold mb-1">Telemetry Evidence Gathered</div>
              <div className="text-slate-300 bg-[#0d1322] p-3 rounded-lg border border-[#1e293b] font-mono">
                {selectedFinding.observed_metrics}
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-semibold mb-1">Suggested Next Step</div>
              <div className="text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                {selectedFinding.suggested_next_step}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b]">
                <div className="text-slate-400">Confidence Rating</div>
                <div className="text-sm font-bold text-white">{selectedFinding.confidence_level}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b]">
                <div className="text-slate-400">Estimated Monthly Savings</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  ${selectedFinding.estimated_monthly_savings.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
