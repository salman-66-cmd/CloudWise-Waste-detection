import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';
import { alertsApi } from '../services/api';
import type { Alert } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertsApi.list({
        severity: severityFilter,
        status: statusFilter,
      });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleToggleRead = async (item: Alert) => {
    try {
      await alertsApi.update(item.alert_id, { is_read: !item.is_read });
      fetchAlerts();
    } catch {
      window.alert('Failed to update alert state.');
    }
  };

  const handleToggleResolve = async (item: Alert) => {
    const nextStatus = item.status === 'active' ? 'resolved' : 'active';
    try {
      await alertsApi.update(item.alert_id, { status: nextStatus, is_read: true });
      fetchAlerts();
    } catch {
      window.alert('Failed to update alert status.');
    }
  };

  const severityIcon = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Alerts & Anomaly Incidents
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time threshold triggers, sudden utilization drops, and resource waste notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
            {alerts.filter(a => a.status === 'active').length} Active Alerts
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl bg-[#111726] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter Incidents:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-slate-300 outline-hidden"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-slate-300 outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                alert.status === 'resolved'
                  ? 'bg-[#0e1422]/60 border-[#1e293b]/60 opacity-60'
                  : alert.is_read
                  ? 'bg-[#111726] border-[#1e293b]'
                  : 'bg-linear-to-r from-[#141d33] to-[#111726] border-blue-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#090d16] border border-[#1e293b] shrink-0 mt-0.5">
                  {severityIcon(alert.severity)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-tight">{alert.title}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                      {alert.alert_type}
                    </span>
                    {alert.resource_id && (
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                        {alert.resource_id}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>

                  <div className="text-[10px] text-slate-500 flex items-center gap-3">
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span className={alert.status === 'resolved' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      Status: {alert.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleRead(alert)}
                  className="px-2.5 py-1 rounded-md bg-[#090d16] border border-[#1e293b] hover:border-slate-600 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  {alert.is_read ? 'Mark Unread' : 'Mark Read'}
                </button>

                <button
                  onClick={() => handleToggleResolve(alert)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                    alert.status === 'resolved'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  {alert.status === 'resolved' ? (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      <span>Reopen</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Resolve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-xl bg-[#111726] border border-[#1e293b] text-slate-400 text-xs">
            No incidents detected. All monitored systems are operating within configured tolerances!
          </div>
        )}
      </div>
    </div>
  );
};
