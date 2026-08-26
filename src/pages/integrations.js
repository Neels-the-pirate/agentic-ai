import { useState, useEffect } from 'react';
import {
  Plug,
  Mail,
  Slack,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Unlink,
  Key,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import api from '../services/api';

const providersMetadata = {
  gmail: {
    name: 'Gmail',
    description: 'Trigger workflows from inbound emails and send automated notifications.',
    icon: Mail,
    color: 'from-red-500 to-rose-600',
    type: 'oauth',
  },
  slack: {
    name: 'Slack',
    description: 'Broadcast alerts, execution failure escalations, and status reports to channels.',
    icon: Slack,
    color: 'from-purple-500 to-indigo-600',
    type: 'oauth',
  },
  discord: {
    name: 'Discord',
    description: 'Post structured bot messages and webhook notifications to community servers.',
    icon: MessageSquare,
    color: 'from-blue-500 to-indigo-700',
    type: 'bot_or_oauth',
  },
  'google-sheets': {
    name: 'Google Sheets',
    description: 'Append live execution records and query data tables for scheduled jobs.',
    icon: FileSpreadsheet,
    color: 'from-emerald-500 to-teal-600',
    type: 'oauth',
  },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/integrations');
      setIntegrations(res.data.integrations || []);
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleOAuthConnect = async (provider) => {
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.data.redirectUrl) {
        // Direct redirect or simulated connect in dev
        window.location.href = res.data.redirectUrl;
      }
    } catch (err) {
      alert('OAuth initialization failed');
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Disconnect ${provider}? Existing workflows using this integration will fall back to simulation mode.`)) return;
    try {
      await api.delete(`/integrations/${provider}`);
      fetchIntegrations();
    } catch (err) {
      alert('Failed to disconnect integration');
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!selectedProvider || !manualToken) return;
    setSavingManual(true);
    try {
      await api.post('/integrations', {
        provider: selectedProvider,
        credentials: { botToken: manualToken, apiKey: manualToken },
        accountIdentifier: 'manual_bot_token',
      });
      setSelectedProvider(null);
      setManualToken('');
      fetchIntegrations();
    } catch (err) {
      alert('Failed to save credentials');
    } finally {
      setSavingManual(false);
    }
  };

  const integrationMap = integrations.reduce((acc, item) => ({ ...acc, [item.provider]: item }), {});

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Third-Party Integrations</h1>
            <p className="text-xs text-slate-400 mt-1">
              Connect external tools via OAuth. Sensitive tokens are encrypted at rest with AES-256.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500 text-sm">Loading integration statuses...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.entries(providersMetadata).map(([key, meta]) => {
                const conn = integrationMap[key];
                const isConnected = conn?.isConnected;
                const Icon = meta.icon;

                return (
                  <div
                    key={key}
                    className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${meta.color} flex items-center justify-center shadow-lg`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">{meta.name}</h3>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {conn?.accountIdentifier || 'Not connected'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                            isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Connected</span>
                            </>
                          ) : (
                            <span>Disconnected</span>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-4 leading-relaxed">{meta.description}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      {isConnected ? (
                        <>
                          <span className="text-[11px] text-emerald-400/80 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Encrypted at rest</span>
                          </span>
                          <button
                            onClick={() => handleDisconnect(key)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold transition"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                            <span>Disconnect</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 w-full justify-end">
                          <button
                            onClick={() => handleOAuthConnect(key)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>OAuth Connect</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
