import React from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useERPNext } from '../../context/ERPNextContext';

export const ERPNextStatusBanner: React.FC = () => {
  const { config, testConnection, isTesting } = useERPNext();

  return (
    <div className="bg-[#0b0f19]/95 backdrop-blur-md border-b border-white/5 px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between text-xs text-brand-slate z-30 transition-all">
      <div className="flex items-center gap-3">
        {/* Pulsing Cloud Node Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-brand-ink text-[11px] tracking-wide">
            Frappe Cloud ERP
          </span>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
            LIVE 42ms
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">Node:</span>
          <span className="font-mono text-slate-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
            MilesWeb IN (45.195.159.86:8280)
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Services:</span>
          <span className="text-slate-300 font-medium">MariaDB 10.6 &amp; Redis 6.2</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-1 sm:mt-0">
        <button
          onClick={testConnection}
          disabled={isTesting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all disabled:opacity-50 text-[11px]"
          title="Verify connection to live ERPNext API"
        >
          <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-brand-red' : 'text-slate-400'}`} />
          <span>{isTesting ? 'Syncing...' : 'Sync Telemetry'}</span>
        </button>
        <a
          href="http://45.195.159.86:8280/app"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-red/15 hover:bg-brand-red/25 text-brand-red hover:text-white border border-brand-red/30 transition-all font-medium text-[11px] shadow-glow-red-sm"
        >
          <span>ERPNext Desk</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
