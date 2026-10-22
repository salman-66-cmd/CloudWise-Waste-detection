import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileText,
  Filter,
  DollarSign
} from 'lucide-react';
import { recommendationsApi } from '../services/api';
import type { Recommendation } from '../types';
import { Modal } from '../components/Modal';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Review modal state
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('Approved');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await recommendationsApi.list({
        status: statusFilter,
        risk_level: riskFilter,
      });
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [statusFilter, riskFilter]);

  const handleOpenReview = (rec: Recommendation) => {
    setSelectedRec(rec);
    setReviewStatus(rec.status === 'New' ? 'Approved' : rec.status);
    setReviewNotes(rec.review_notes || '');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRec) return;
    setSubmitting(true);
    try {
      await recommendationsApi.updateStatus(selectedRec.recommendation_id, reviewStatus, reviewNotes);
      setSelectedRec(null);
      fetchRecommendations();
    } catch (err) {
      alert('Failed to update recommendation status.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Optimization Recommendations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Human-in-the-loop review workflow. Automatic cloud state mutation is disabled for maximum safety.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Shield className="w-4 h-4" />
          <span>Review-Only Governance Active</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl bg-[#111726] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter Action Items:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-slate-300 outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Risk Level */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-slate-300 outline-hidden"
          >
            <option value="all">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div
              key={rec.recommendation_id}
              className="rounded-xl bg-[#111726] border border-[#1e293b] p-5 hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(rec.status)}`}>
                      {rec.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getRiskBadge(rec.risk_level)}`}>
                      {rec.risk_level} Risk
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                      {rec.resource_id}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block">Est. Savings</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ${rec.estimated_monthly_savings.toFixed(2)}/mo
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{rec.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    <strong className="text-blue-400">Action:</strong> {rec.suggested_action}
                  </p>
                </div>

                {/* Evidence & Config details */}
                <div className="p-3 rounded-lg bg-[#0d1322] border border-[#1e293b] space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400">Current Config: </span>
                    <span className="text-slate-200">{rec.current_configuration}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Evidence: </span>
                    <span className="text-slate-300 font-mono text-[11px]">{rec.evidence}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Impact: </span>
                    <span className="text-slate-300">{rec.operational_impact}</span>
                  </div>
                </div>

                {rec.review_notes && (
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 italic">
                    Review note: "{rec.review_notes}" ({rec.reviewed_by || 'Reviewer'})
                  </div>
                )}
              </div>

              {/* Action Button at bottom */}
              <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Confidence: <strong className="text-slate-300">{rec.confidence_level}</strong>
                </span>
                <button
                  onClick={() => handleOpenReview(rec)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-semibold border border-blue-500/30 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Review Workflow</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 text-center rounded-xl bg-[#111726] border border-[#1e293b] text-slate-400 text-xs">
            No recommendations found matching current criteria.
          </div>
        )}
      </div>

      {/* Review Workflow Modal */}
      <Modal
        isOpen={!!selectedRec}
        onClose={() => setSelectedRec(null)}
        title={selectedRec ? `Review Recommendation: ${selectedRec.recommendation_id}` : ''}
      >
        {selectedRec && (
          <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] space-y-1">
              <div className="text-sm font-bold text-white">{selectedRec.title}</div>
              <div className="text-slate-400 text-[11px]">Target: {selectedRec.resource_id}</div>
              <div className="text-emerald-400 font-mono font-bold mt-1">
                Savings: ${selectedRec.estimated_monthly_savings.toFixed(2)}/mo
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">Workflow Decision</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              >
                <option value="New">New (Pending)</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved (Awaiting manual execution)</option>
                <option value="Completed">Completed (Manually executed)</option>
                <option value="Rejected">Rejected (Intentional overprovisioning)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">Review Notes & Operational Comments</label>
              <textarea
                rows={3}
                placeholder="e.g. Approved during architecture sprint; instances to be resized during Sunday midnight maintenance window."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white placeholder-slate-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Rollback & Safety Considerations</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200">
                {selectedRec.rollback_considerations}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setSelectedRec(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
              >
                {submitting ? 'Saving...' : 'Confirm Decision'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
