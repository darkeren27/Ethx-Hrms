import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';

interface AccessRestrictedProps {
  allowedRoles?: string[];
  currentRole?: string;
  customMessage?: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  allowedRoles = ['HR Admin'],
  currentRole,
  customMessage
}) => {
  const { role } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-brand-card border border-brand-border/80 rounded-3xl p-8 text-center shadow-card-dark relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-brand-red/15 border border-brand-red/30 text-brand-red flex items-center justify-center mx-auto mb-5 shadow-glow-red-sm">
          <Lock className="w-8 h-8" />
        </div>

        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-red bg-brand-red/10 px-3 py-1 rounded-full border border-brand-red/20 inline-flex items-center gap-1.5 mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          RBAC Security Policy Enforcement
        </span>

        <h2 className="text-xl font-extrabold text-brand-ink mb-2">
          Access Restricted
        </h2>

        <p className="text-xs text-brand-slate leading-relaxed mb-6">
          {customMessage || (
            <>
              You are signed in with the role <strong className="text-brand-ink">{currentRole || role}</strong>.
              Per company data governance and role-based access control, this module is reserved for{' '}
              <strong className="text-brand-red">{allowedRoles.join(' / ')}</strong> personnel only. Employees are restricted to viewing only their own personnel records.
            </>
          )}
        </p>

        <div>
          <Link to="/dashboard" className="block w-full">
            <Button className="w-full text-xs font-bold" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Return to My Workspace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
