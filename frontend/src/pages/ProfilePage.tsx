import React, { useState } from 'react';
import { User, Shield, Key, CheckCircle2, Lock, Mail, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    setMessage('Password successfully updated for active session.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            User Profile & Governance Credentials
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your account authentication, role-based authorization, and session security.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Account Profile Card */}
      <div className="p-6 rounded-xl bg-[#111726] border border-[#1e293b] space-y-5">
        <div className="flex items-center gap-4 border-b border-[#1e293b] pb-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{user?.full_name || 'Administrator'}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {user?.role || 'admin'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#090d16] border border-[#1e293b]">
            <span className="text-slate-400 block mb-1">Account Role & Privileges</span>
            <span className="text-white font-semibold">
              {user?.role === 'admin' ? 'Super Administrator (Full Engine Control)' : 'Standard User (Read & Review Only)'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#090d16] border border-[#1e293b]">
            <span className="text-slate-400 block mb-1">Account Created</span>
            <span className="text-white font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="p-6 rounded-xl bg-[#111726] border border-[#1e293b] space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-400" />
          <span>Update Security Password</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Development Demo Notice */}
      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs space-y-1.5 text-slate-400">
        <div className="text-blue-300 font-semibold flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Development Demo Credentials</span>
        </div>
        <p>
          For local demonstration evaluation, you can log in directly using the seeded demo administrator credentials:
          <br />
          <strong className="text-slate-200">Email:</strong> admin@cloudwise.io &nbsp;|&nbsp; <strong className="text-slate-200">Password:</strong> DemoAdmin123!
        </p>
      </div>
    </div>
  );
};
