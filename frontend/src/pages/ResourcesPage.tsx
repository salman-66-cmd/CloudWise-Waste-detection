import React, { useState, useEffect } from 'react';
import {
  Server,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit2,
  RefreshCw,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { resourcesApi, simulatorApi } from '../services/api';
import type { CloudResource } from '../types';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/LoadingSkeleton';

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('monthly_cost');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  // Modals & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<CloudResource | null>(null);

  const [formData, setFormData] = useState({
    resource_id: '',
    name: '',
    provider: 'AWS',
    region: 'us-east-1',
    resource_type: 'Virtual Machines',
    environment: 'Development',
    instance_size: 't3.medium',
    cpu_utilization: 5.0,
    memory_utilization: 20.0,
    hourly_cost: 0.0416,
    status: 'running',
    is_attached: true,
  });

  const [message, setMessage] = useState<string | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await resourcesApi.list({
        page,
        page_size: pageSize,
        provider: providerFilter,
        resource_type: typeFilter,
        environment: envFilter,
        status: statusFilter,
        search: searchTerm,
        sort_by: sortBy,
        sort_desc: sortDesc,
      });
      setResources(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [page, providerFilter, typeFilter, envFilter, statusFilter, sortBy, sortDesc]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResources();
  };

  const handleOpenAdd = () => {
    const randomId = `res-${Math.random().toString(36).substring(2, 9)}`;
    setFormData({
      resource_id: randomId,
      name: '',
      provider: 'AWS',
      region: 'us-east-1',
      resource_type: 'Virtual Machines',
      environment: 'Development',
      instance_size: 't3.medium',
      cpu_utilization: 5.0,
      memory_utilization: 20.0,
      hourly_cost: 0.0416,
      status: 'running',
      is_attached: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (res: CloudResource) => {
    setSelectedResource(res);
    setFormData({
      resource_id: res.resource_id,
      name: res.name,
      provider: res.provider,
      region: res.region,
      resource_type: res.resource_type,
      environment: res.environment,
      instance_size: res.instance_size,
      cpu_utilization: res.cpu_utilization,
      memory_utilization: res.memory_utilization || 0,
      hourly_cost: res.hourly_cost,
      status: res.status,
      is_attached: res.is_attached,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resourcesApi.create(formData);
      setIsAddModalOpen(false);
      setMessage(`Resource ${formData.name} registered.`);
      fetchResources();
    } catch (err) {
      alert('Error creating resource. Resource ID must be unique.');
    }
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;
    try {
      await resourcesApi.update(selectedResource.resource_id, formData);
      setIsEditModalOpen(false);
      setMessage(`Resource ${formData.name} updated.`);
      fetchResources();
    } catch (err) {
      alert('Error updating resource.');
    }
  };

  const handleDeleteResource = async () => {
    if (!selectedResource) return;
    try {
      await resourcesApi.delete(selectedResource.resource_id);
      setIsDeleteModalOpen(false);
      setMessage(`Resource ${selectedResource.name} deleted.`);
      fetchResources();
    } catch (err) {
      alert('Error deleting resource.');
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await resourcesApi.importCsv(file);
      setMessage(`Imported metrics: ${res.processed} updated, ${res.errors} errors.`);
      fetchResources();
    } catch {
      alert('Failed to import CSV.');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/resources/export/csv', '_blank');
  };

  const handleSeedDemoData = async () => {
    try {
      await simulatorApi.run(true);
      setMessage('Demo assets regenerated successfully!');
      fetchResources();
    } catch {
      alert('Failed to generate demo data.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Cloud Resources Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-cloud asset catalog, telemetry profiles, and sizing parameters.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSeedDemoData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-medium transition-all"
            title="Populate realistic demo resources"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generate Demo Assets</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111726] border border-[#1e293b] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
          </label>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111726] border border-[#1e293b] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Message notification */}
      {message && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-[#111726] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search resources by name, ID, region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Provider */}
          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-2.5 py-2 text-slate-300 outline-hidden"
          >
            <option value="all">All Providers</option>
            <option value="AWS">AWS</option>
            <option value="GCP">GCP</option>
            <option value="Azure">Azure</option>
            <option value="Simulated">Simulated</option>
          </select>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-2.5 py-2 text-slate-300 outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="Virtual Machines">Virtual Machines</option>
            <option value="Containers">Containers</option>
            <option value="Managed Databases">Managed Databases</option>
            <option value="Object Storage">Object Storage</option>
            <option value="Block Storage Volumes">Block Storage</option>
            <option value="Load Balancers">Load Balancers</option>
          </select>

          {/* Environment */}
          <select
            value={envFilter}
            onChange={(e) => { setEnvFilter(e.target.value); setPage(1); }}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-2.5 py-2 text-slate-300 outline-hidden"
          >
            <option value="all">All Envs</option>
            <option value="Production">Production</option>
            <option value="Staging">Staging</option>
            <option value="Development">Development</option>
            <option value="Testing">Testing</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#090d16] border border-[#1e293b] rounded-lg px-2.5 py-2 text-slate-300 outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="idle">Idle</option>
            <option value="unattached">Unattached</option>
          </select>
        </div>
      </div>

      {/* Main Inventory Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="rounded-xl bg-[#111726] border border-[#1e293b] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1322] border-b border-[#1e293b] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Resource Details</th>
                  <th className="py-3.5 px-4 font-semibold">Provider / Env</th>
                  <th className="py-3.5 px-4 font-semibold">Type & Size</th>
                  <th className="py-3.5 px-4 font-semibold">CPU Load</th>
                  <th className="py-3.5 px-4 font-semibold">RAM Load</th>
                  <th className="py-3.5 px-4 font-semibold">Monthly Spend</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {resources.length > 0 ? (
                  resources.map((res) => {
                    const isWasteful = res.optimization_status === 'wasteful' || res.optimization_status === 'underutilized' || res.status === 'unattached';
                    return (
                      <tr key={res.resource_id} className="hover:bg-[#151e33] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{res.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{res.resource_id} • {res.region}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium">
                              {res.provider}
                            </span>
                            <span className="text-slate-400 text-[11px]">{res.environment}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200">{res.resource_type}</div>
                          <div className="text-[10px] text-slate-400">{res.instance_size}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  res.cpu_utilization > 60
                                    ? 'bg-emerald-500'
                                    : res.cpu_utilization > 20
                                    ? 'bg-blue-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, res.cpu_utilization)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-slate-300">
                              {res.cpu_utilization.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {res.memory_utilization !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-purple-500"
                                  style={{ width: `${Math.min(100, res.memory_utilization)}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-mono text-slate-300">
                                {res.memory_utilization.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">No agent</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-200 font-mono">${res.monthly_cost.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500 font-mono">${res.hourly_cost.toFixed(4)}/h</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              res.status === 'running'
                                ? isWasteful
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : res.status === 'unattached'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-700/30 text-slate-400 border-slate-700/50'
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(res)}
                              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedResource(res);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No cloud resources found matching criteria. Click "Generate Demo Assets" to populate!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="p-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {resources.length} of {total} cloud resources
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-md bg-[#090d16] border border-[#1e293b] hover:border-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {page} of {Math.ceil(total / pageSize) || 1}</span>
              <button
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-md bg-[#090d16] border border-[#1e293b] hover:border-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Cloud Resource">
        <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Resource ID</label>
            <input
              type="text"
              required
              value={formData.resource_id}
              onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Resource Name</label>
            <input
              type="text"
              required
              placeholder="e.g. staging-payment-processor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              >
                <option value="AWS">AWS</option>
                <option value="GCP">GCP</option>
                <option value="Azure">Azure</option>
                <option value="Simulated">Simulated</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Environment</label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Resource Type</label>
              <select
                value={formData.resource_type}
                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              >
                <option value="Virtual Machines">Virtual Machines</option>
                <option value="Containers">Containers</option>
                <option value="Managed Databases">Managed Databases</option>
                <option value="Object Storage">Object Storage</option>
                <option value="Block Storage Volumes">Block Storage Volumes</option>
                <option value="Load Balancers">Load Balancers</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Instance / Size Tier</label>
              <input
                type="text"
                value={formData.instance_size}
                onChange={(e) => setFormData({ ...formData, instance_size: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Hourly Cost ($/hr)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.hourly_cost}
                onChange={(e) => setFormData({ ...formData, hourly_cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              >
                <option value="running">running</option>
                <option value="stopped">stopped</option>
                <option value="idle">idle</option>
                <option value="unattached">unattached</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Save Resource
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Resource Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${selectedResource?.name}`}>
        <form onSubmit={handleUpdateResource} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Resource Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Instance / Size Tier</label>
              <input
                type="text"
                value={formData.instance_size}
                onChange={(e) => setFormData({ ...formData, instance_size: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Hourly Cost ($/hr)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.hourly_cost}
                onChange={(e) => setFormData({ ...formData, hourly_cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Current Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              >
                <option value="running">running</option>
                <option value="stopped">stopped</option>
                <option value="idle">idle</option>
                <option value="unattached">unattached</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Attached Status</label>
              <select
                value={formData.is_attached ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_attached: e.target.value === 'true' })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              >
                <option value="true">Attached</option>
                <option value="false">Unattached</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Update Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Resource Deletion" maxWidth="sm">
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to remove <span className="font-bold text-white">{selectedResource?.name}</span> ({selectedResource?.resource_id}) from active monitoring?
          </p>
          <p className="text-slate-500 text-[11px]">
            Historical metrics and associated waste findings will also be archived.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteResource}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
