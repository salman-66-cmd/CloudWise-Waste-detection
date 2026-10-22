import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Shield,
  Cloud,
  RefreshCw,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { settingsApi } from '../services/api';
import type { SystemSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    idle_cpu_threshold: 5.0,
    underutilized_cpu_threshold: 20.0,
    low_memory_threshold: 25.0,
    unattached_storage_days: 7,
    low_traffic_lb_mbps: 0.5,
    stale_resource_days: 14,
    monthly_billable_hours: 730,
    observation_window_days: 7,
    min_metrics_count: 5,
    aws_enabled: false,
  });

  const [awsStatus, setAwsStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncingAws, setSyncingAws] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sett, aws] = await Promise.all([
          settingsApi.getSettings(),
          settingsApi.getAwsStatus(),
        ]);
        setSettings(sett);
        setAwsStatus(aws);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await settingsApi.updateSettings(settings);
      setSettings(updated);
      setMessage('Threshold rules updated successfully. Next waste scan will apply these parameters.');
      setTimeout(() => setMessage(null), 5000);
    } catch {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncAws = async () => {
    setSyncingAws(true);
    try {
      const res = await settingsApi.syncAws();
      if (res.success) {
        setMessage(`AWS Sync Success: ${res.imported_count} resources imported.`);
      } else {
        setMessage(`AWS Status: ${res.error || 'Operating in local simulation mode.'}`);
      }
      const aws = await settingsApi.getAwsStatus();
      setAwsStatus(aws);
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage('AWS scan failed or credentials not present.');
    } finally {
      setSyncingAws(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            System & Engine Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure algorithmic heuristic thresholds, observation windows, and optional cloud integrations.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Thresholds Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="p-6 rounded-xl bg-[#111726] border border-[#1e293b] space-y-5">
          <div className="border-b border-[#1e293b] pb-3">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Waste Detection Engine Rules (A through H)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Adjust thresholds used to flag idle assets, rightsizing opportunities, and stale storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Rule A: Idle CPU */}
            <div className="space-y-1.5">
              <label className="block text-slate-200 font-semibold">
                Idle CPU Threshold (%) [Rule A]
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="20"
                value={settings.idle_cpu_threshold}
                onChange={(e) => setSettings({ ...settings, idle_cpu_threshold: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
              <span className="text-[11px] text-slate-500 block">
                Instances averaging below this CPU % are flagged as completely idle.
              </span>
            </div>

            {/* Rule B: Underutilized CPU */}
            <div className="space-y-1.5">
              <label className="block text-slate-200 font-semibold">
                Underutilized CPU Threshold (%) [Rule B]
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="50"
                value={settings.underutilized_cpu_threshold}
                onChange={(e) => setSettings({ ...settings, underutilized_cpu_threshold: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
              <span className="text-[11px] text-slate-500 block">
                Consistently under this threshold triggers instance rightsizing recommendations.
              </span>
            </div>

            {/* Rule C: Low Memory */}
            <div className="space-y-1.5">
              <label className="block text-slate-200 font-semibold">
                Low Memory Threshold (%) [Rule C]
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="50"
                value={settings.low_memory_threshold}
                onChange={(e) => setSettings({ ...settings, low_memory_threshold: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
              <span className="text-[11px] text-slate-500 block">
                Evaluated only when agent memory telemetry is active.
              </span>
            </div>

            {/* Rule E: Unattached Storage */}
            <div className="space-y-1.5">
              <label className="block text-slate-200 font-semibold">
                Unattached Storage Inactivity (Days) [Rule E]
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="60"
                value={settings.unattached_storage_days}
                onChange={(e) => setSettings({ ...settings, unattached_storage_days: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
              <span className="text-[11px] text-slate-500 block">
                Days an unattached EBS/disk volume can exist before critical flagging.
              </span>
            </div>

            {/* Rule G: Low Traffic LB */}
            <div className="space-y-1.5">
              <label className="block text-slate-200 font-semibold">
                Low-Traffic Load Balancer (MB/s) [Rule G]
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={settings.low_traffic_lb_mbps}
                onChange={(e) => setSettings({ ...settings, low_traffic_lb_mbps: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
              <span className="text-[11px] text-slate-500 block">
                Average throughput below this threshold flags inactive ALBs/NLBs.
              </span>
            </div>

            {/* Rule H: Stale Resource */}
            <div className="space-y-1.5">
              <label className="block text-slate-200 font-semibold">
                Stale Resource Inactivity (Days) [Rule H]
              </label>
              <input
                type="number"
                step="1"
                min="3"
                max="90"
                value={settings.stale_resource_days}
                onChange={(e) => setSettings({ ...settings, stale_resource_days: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
              <span className="text-[11px] text-slate-500 block">
                Resources with no activity across this window are flagged as stale.
              </span>
            </div>

            {/* Monthly Hours */}
            <div className="space-y-1.5">
              <label className="block text-slate-200 font-semibold">
                Billable Hours per Month
              </label>
              <input
                type="number"
                step="1"
                min="700"
                max="744"
                value={settings.monthly_billable_hours}
                onChange={(e) => setSettings({ ...settings, monthly_billable_hours: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
              <span className="text-[11px] text-slate-500 block">
                Standard baseline (730h = 365 days / 12 months * 24h).
              </span>
            </div>

            {/* Observation Window Days */}
            <div className="space-y-1.5">
              <label className="block text-slate-200 font-semibold">
                Observation Window (Days)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="30"
                value={settings.observation_window_days}
                onChange={(e) => setSettings({ ...settings, observation_window_days: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
              <span className="text-[11px] text-slate-500 block">
                Historical span required before issuing confident recommendations.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#1e293b]">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Optional AWS Cloud Integration Card */}
      <div className="p-6 rounded-xl bg-[#111726] border border-[#1e293b] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#1e293b] pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Optional Real AWS Integration Adapter</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Read-only connector for live EC2 inventory, CloudWatch metrics, and EBS status.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              awsStatus?.configured
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}
          >
            {awsStatus?.mode === 'live_aws' ? 'LIVE AWS ACTIVE' : 'LOCAL SIMULATOR ACTIVE'}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#090d16] border border-[#1e293b] text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200">Current Adapter Status:</div>
          <p className="text-slate-400 leading-relaxed">{awsStatus?.message}</p>
          <div className="text-[11px] text-slate-500 pt-1">
            Configured Region: <strong className="text-slate-400">{awsStatus?.region || 'us-east-1'}</strong>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#0d1322] border border-[#1e293b] text-xs space-y-2 text-slate-400">
          <div className="text-slate-200 font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>How to connect live AWS (Zero Hardcoded Secrets):</span>
          </div>
          <p>
            Create or edit <code className="text-cyan-400 font-mono">.env</code> in your project root with your read-only IAM credentials:
          </p>
          <pre className="p-3 rounded bg-[#090d16] border border-[#1e293b] text-[11px] font-mono text-slate-300 overflow-x-auto">
{`AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
AWS_ENABLED=true`}
          </pre>
          <p className="text-[11px] text-slate-500">
            Note: All core features operate completely without AWS credentials via the realistic simulator!
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSyncAws}
            disabled={syncingAws}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#151e33] border border-blue-500/30 hover:border-blue-500 text-blue-400 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAws ? 'animate-spin' : ''}`} />
            <span>{syncingAws ? 'Testing Connection...' : 'Test AWS Connection & Sync'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
