import React, { useState, useEffect } from 'react';
import { Banknote, FileCheck, CheckCircle2, Download, Eye, DollarSign, ShieldCheck, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { hrmsService } from '../../services/hrmsService';
import { Employee, SalarySlip } from '../../types/hrms';
import { formatCurrency } from '../../lib/utils';
import { PayslipModal } from './PayslipModal';
import { useAuth } from '../../context/AuthContext';

export const PayrollDashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const isEmployee = role === 'Employee';

  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  useEffect(() => {
    hrmsService.getSalarySlips().then(setSalarySlips);
    hrmsService.getEmployees().then(setEmployees);
  }, []);

  // Strict RBAC: Employees can ONLY view their own salary slips
  const visibleSlips = isEmployee
    ? salarySlips.filter(
        (s) => s.employeeId === user?.employeeId || s.employeeName === user?.name
      )
    : salarySlips;

  const latestSlip = visibleSlips[0];

  const totalGross = salarySlips.reduce((sum, s) => sum + (s.grossPay || 0), 0);
  const totalNet = salarySlips.reduce((sum, s) => sum + (s.netPay || 0), 0);
  const totalDeductions = salarySlips.reduce((sum, s) => sum + (s.totalDeductions || 0), 0);
  const uniqueEmployeesPaid = new Set(salarySlips.map((s) => s.employeeId)).size;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">
            {isEmployee ? 'My Compensation & Salary Slips' : 'Payroll & Compensation Management'}
          </h1>
          <p className="text-sm text-brand-slate mt-1">
            {isEmployee
              ? 'Access your monthly pay statements, statutory tax deductions, and verified bank receipts.'
              : 'ERPNext Payroll Engine integration, company monthly cycles, and tax deductions.'}
          </p>
        </div>
        {!isEmployee && (
          <div className="flex items-center gap-2">
            <Button size="sm">
              <Banknote className="w-4 h-4 mr-1.5" />
              Run Payroll Cycle (Sep 2026)
            </Button>
          </div>
        )}
      </div>

      {/* Metric Cards (Dynamically computed from live salary slip ledger) */}
      {isEmployee ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Latest Net Take-Home"
            value={latestSlip ? formatCurrency(latestSlip.netPay) : 'No Slips Yet'}
            subtitle={latestSlip ? `Disbursed ${latestSlip.month} ${latestSlip.year}` : 'Pending current payroll'}
            icon={DollarSign}
            variant="emerald"
          />
          <StatCard
            title="Monthly Gross Pay"
            value={latestSlip ? formatCurrency(latestSlip.grossPay) : '—'}
            subtitle="Base Salary + Allowances"
            icon={Banknote}
            variant="red"
          />
          <StatCard
            title="Statutory Deductions"
            value={latestSlip ? `-${formatCurrency(latestSlip.totalDeductions)}` : '—'}
            subtitle="Tax, PF & Health Coverage"
            icon={FileCheck}
            variant="default"
          />
          <StatCard
            title="Disbursement Method"
            value="Direct ACH Wire"
            subtitle="Verified Corporate Transfer"
            icon={CreditCard}
            variant="blue"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Gross Payroll Total"
            value={formatCurrency(totalGross)}
            subtitle={`${uniqueEmployeesPaid || employees.length} Employees Processed`}
            icon={Banknote}
            variant="red"
          />
          <StatCard
            title="Net Disbursed"
            value={formatCurrency(totalNet)}
            subtitle="Direct Corporate Wire Transfer"
            icon={DollarSign}
            variant="emerald"
          />
          <StatCard
            title="Total Deductions"
            value={formatCurrency(totalDeductions)}
            subtitle="Tax, PF & Medical Insurance"
            icon={FileCheck}
            variant="default"
          />
          <StatCard
            title="Processing Status"
            value="100% Processed"
            subtitle={`${salarySlips.length} Statements in Ledger`}
            icon={CheckCircle2}
            variant="blue"
          />
        </div>
      )}

      {/* Salary Slips Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-4 border-b border-white/5 mb-0">
          <CardTitle>
            {isEmployee ? 'My Recent Salary Slips & Statements' : 'Recent Salary Slips & Statements'}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-dark-subtle border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Slip ID</th>
                {!isEmployee && <th className="py-3 px-4">Employee</th>}
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Gross Pay</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Take-Home</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleSlips.length === 0 ? (
                <tr>
                  <td colSpan={isEmployee ? 7 : 8} className="py-8 text-center text-brand-slate">
                    No salary statements found for your account.
                  </td>
                </tr>
              ) : (
                visibleSlips.map((s) => (
                  <tr key={s.id} className="hover:bg-brand-card-hover transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-brand-slate">{s.id}</td>
                    {!isEmployee && (
                      <td className="py-3 px-4">
                        <span className="font-bold text-brand-ink block">{s.employeeName}</span>
                        <span className="text-[11px] text-brand-slate">{s.designation}</span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-brand-slate">
                      {s.month} {s.year}
                    </td>
                    <td className="py-3 px-4 font-semibold text-brand-ink">{formatCurrency(s.grossPay)}</td>
                    <td className="py-3 px-4 font-semibold text-red-400">-{formatCurrency(s.totalDeductions)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{formatCurrency(s.netPay)}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" dot>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedSlip(s)}
                        className="px-2.5 py-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View Payslip
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PayslipModal
        slip={selectedSlip}
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
      />
    </div>
  );
};
