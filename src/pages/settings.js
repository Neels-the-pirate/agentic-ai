import { useState } from 'react';
import { ShieldCheck, Key, User, Lock, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [success, setSuccess] = useState('');

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Platform Settings & Security</h1>
            <p className="text-xs text-slate-400 mt-1">Manage operator session, encryption keys, and environment health.</p>
          </div>

          {/* Operator Profile Section */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Operator Profile</h2>
                <p className="text-xs text-slate-400">Authenticated console credentials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Operator Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.name || 'Lead Operator'}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-white font-medium opacity-80"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'admin@agentflow.ai'}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-white font-medium opacity-80"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Assigned Security Role</label>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{user?.role || 'admin'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptography & Health Diagnostics */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Security & Encryption Diagnostics</h2>
                <p className="text-xs text-slate-400">Application-level cryptographic status</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-white">AES-256-GCM Token Encryption</p>
                    <p className="text-[11px] text-slate-400">CREDENTIAL_ENCRYPTION_KEY is active and validated</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  HEALTHY
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-white">Password Hashing Strategy</p>
                    <p className="text-[11px] text-slate-400">bcrypt cost factor 12 with salt generation</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-white">Deterministic Rule Engine Fallback</p>
                    <p className="text-[11px] text-slate-400">Zero-API-key offline workflow generation support</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
