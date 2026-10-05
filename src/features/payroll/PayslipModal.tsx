import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { SalarySlip } from '../../types/hrms';
import { formatCurrency } from '../../lib/utils';
import { Printer, Download, Building } from 'lucide-react';

interface PayslipModalProps {
  slip: SalarySlip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ slip, isOpen, onClose }) => {
  if (!slip) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Salary Statement — ${slip.month} ${slip.year}`} maxWidth="xl">
      <div className="space-y-6 text-brand-ink print:text-black">
        {/* Company and Slip Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/brand/ethx-logo-footer.png"
                alt="ETHX Softcon"
                className="h-7 w-auto object-contain"
              />
              <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-brand-red text-white uppercase shadow-glow-red-sm">
                OFFICIAL PAYSLIP
              </span>
            </div>
            <p className="text-[11px] text-brand-slate mt-1">
              Global Enterprise HRMS & Payroll Service • Tax ID: US-EIN-884920
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
              {slip.id}
            </span>
            <p className="text-[11px] text-brand-slate mt-1">Dispatched: {slip.postingDate}</p>
          </div>
        </div>

        {/* Employee Info Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-brand-card-hover border border-white/5 text-xs">
          <div>
            <span className="text-brand-slate block text-[10px] uppercase font-bold">Employee Name</span>
            <span className="font-bold text-brand-ink">{slip.employeeName}</span>
          </div>
          <div>
            <span className="text-brand-slate block text-[10px] uppercase font-bold">Employee ID</span>
            <span className="font-mono text-brand-ink">{slip.employeeId}</span>
          </div>
          <div>
            <span className="text-brand-slate block text-[10px] uppercase font-bold">Department</span>
            <span className="text-brand-ink">{slip.department}</span>
          </div>
          <div>
            <span className="text-brand-slate block text-[10px] uppercase font-bold">Designation</span>
            <span className="text-brand-ink">{slip.designation}</span>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 text-xs font-bold text-emerald-400">
              <span>EARNINGS COMPONENT</span>
              <span>AMOUNT</span>
            </div>
            {slip.earnings.map((e, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-brand-slate">{e.component}</span>
                <span className="font-semibold text-brand-ink">{formatCurrency(e.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-xs font-bold text-brand-ink border-t border-white/10">
              <span>Gross Earnings</span>
              <span className="text-emerald-400">{formatCurrency(slip.grossPay)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-red-500/20 text-xs font-bold text-red-400">
              <span>TAX & STATUTORY DEDUCTION</span>
              <span>AMOUNT</span>
            </div>
            {slip.deductions.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-brand-slate">{d.component}</span>
                <span className="font-semibold text-brand-ink">{formatCurrency(d.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-xs font-bold text-brand-ink border-t border-white/10">
              <span>Total Deductions</span>
              <span className="text-red-400">-{formatCurrency(slip.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Take-Home Highlight */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-brand-red/15 via-brand-card-hover to-brand-card border border-brand-red/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-brand-slate">Net Take-Home Pay</span>
            <h2 className="text-2xl font-black text-brand-ink mt-0.5 tracking-tight font-display">
              {formatCurrency(slip.netPay)}
            </h2>
            <p className="text-[11px] text-emerald-400 mt-0.5">Deposited into {slip.bankAccount}</p>
          </div>
          <div className="text-right text-xs text-brand-slate">
            <p>Disbursed via: <span className="text-brand-ink font-semibold">{slip.paymentMethod}</span></p>
            <p className="mt-0.5">Processed by: <span className="text-brand-ink font-semibold">ERPNext Payroll Engine</span></p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3 print:hidden">
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print Statement
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
