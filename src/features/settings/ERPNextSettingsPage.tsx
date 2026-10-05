import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Key, Server } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useERPNext } from '../../context/ERPNextContext';

export const ERPNextSettingsPage: React.FC = () => {
  const { config, updateConfig, testConnection, isTesting } = useERPNext();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    const res = await testConnection();
    setTestResult(res);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">ERPNext Backend Configuration</h1>
        <p className="text-sm text-brand-slate mt-1">
          Manage REST API gateway, Frappe authentication, and transactional database connections.
        </p>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
          }`}
        >
          {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-red" />
                <CardTitle>Frappe Framework Server Settings</CardTitle>
              </div>
              <a
                href={`${config.url}/app`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-red hover:underline font-semibold flex items-center gap-1"
              >
                Open ERPNext Desk <ExternalLink className="w-3 h-3" />
              </a>
            </CardHeader>

            <div className="space-y-4">
              <Input
                label="ERPNext Base URL"
                value={config.url}
                onChange={(e) => updateConfig({ url: e.target.value })}
                placeholder="http://45.195.159.86:8280"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="API User / Username"
                  value={config.username}
                  onChange={(e) => updateConfig({ username: e.target.value })}
                  placeholder="Administrator"
                />
                <Input
                  label="Password"
                  type="password"
                  value={config.password}
                  onChange={(e) => updateConfig({ password: e.target.value })}
                  placeholder="••••••••••••"
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-brand-slate">Active Status:</span>
                  {config.connected ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Fallback Mode
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleTest}
                    isLoading={isTesting}
                    size="sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Test Connection
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Integration Specs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-red" />
                <CardTitle>Architecture Status</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-brand-slate">Business Engine</span>
                <span className="font-bold text-brand-ink">ERPNext v14/v15</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-brand-slate">Transactional DB</span>
                <span className="font-bold text-brand-ink">MariaDB 10.6+</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-brand-slate">Real-time / Cache</span>
                <span className="font-bold text-brand-ink">Redis 6.2+</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-brand-slate">Experience Layer</span>
                <span className="font-bold text-brand-red">React 18 + Vite</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
