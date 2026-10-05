import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Users, 
  CalendarDays, 
  Clock, 
  Banknote, 
  Briefcase, 
  Target, 
  Network, 
  Settings,
  Laptop,
  GraduationCap,
  BarChart3,
  X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isEmployee = role === 'Employee';
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent, but prevent browser URL bar jump
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allCommands = isEmployee
    ? [
        { title: 'My 360 Personnel Profile', path: `/employees/${user?.id || 'emp-003'}`, icon: Users, category: 'My Workspace' },
        { title: 'Apply for Leave', path: '/leave', icon: CalendarDays, category: 'My Workspace' },
        { title: 'My Attendance & Web Punch', path: '/attendance', icon: Clock, category: 'My Workspace' },
        { title: 'My Payslips & Salary Statements', path: '/payroll', icon: Banknote, category: 'My Workspace' },
        { title: 'My Goals & OKRs', path: '/performance', icon: Target, category: 'Career & Assets' },
        { title: 'My IT Hardware Assets', path: '/assets', icon: Laptop, category: 'Career & Assets' },
        { title: 'Organization Tree', path: '/organization', icon: Network, category: 'Career & Assets' },
        { title: 'Skill Matrix & Competencies', path: '/training', icon: GraduationCap, category: 'Career & Assets' },
      ]
    : [
        { title: 'Employee Directory & Roster', path: '/employees', icon: Users, category: 'Core HR' },
        { title: 'Organization Chart', path: '/organization', icon: Network, category: 'Core HR' },
        { title: 'Attendance Ledger & Biometrics', path: '/attendance', icon: Clock, category: 'Operations' },
        { title: 'Leave Approvals & Workflow', path: '/leave', icon: CalendarDays, category: 'Operations' },
        { title: 'Payroll Engine & Disbursements', path: '/payroll', icon: Banknote, category: 'Operations' },
        { title: 'Recruitment Kanban ATS', path: '/recruitment', icon: Briefcase, category: 'Talent' },
        { title: 'Performance Management & OKRs', path: '/performance', icon: Target, category: 'Talent' },
        { title: 'Skill Matrix & Training', path: '/training', icon: GraduationCap, category: 'Talent' },
        { title: 'IT Asset Tracking & Provisions', path: '/assets', icon: Laptop, category: 'Talent' },
        { title: 'Workforce Intelligence Analytics', path: '/analytics', icon: BarChart3, category: 'System' },
        { title: 'ERPNext API & Server Settings', path: '/settings', icon: Settings, category: 'System' },
      ];

  const filtered = allCommands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-brand-card border border-brand-border rounded-2xl shadow-card-elevated overflow-hidden z-10">
        <div className="h-1 w-full bg-gradient-to-r from-brand-red via-brand-red-hover to-brand-dark" />
        
        <div className="flex items-center px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-brand-red mr-3" />
          <input
            type="text"
            placeholder="Type a command, employee name, or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-brand-ink placeholder-brand-slate text-sm focus:outline-none"
          />
          <button onClick={onClose} className="text-brand-slate hover:text-brand-ink p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-slate">
              No matching pages or actions found.
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((cmd) => (
                <button
                  key={cmd.path}
                  onClick={() => handleSelect(cmd.path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-brand-slate hover:text-brand-ink hover:bg-brand-card-hover group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <cmd.icon className="w-4 h-4 text-brand-slate group-hover:text-brand-red transition-colors" />
                    <span className="font-semibold text-brand-ink">{cmd.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-brand-slate/60 bg-white/5 px-2 py-0.5 rounded">
                    {cmd.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-brand-dark-subtle border-t border-white/5 flex items-center justify-between text-[11px] text-brand-slate/80">
          <span>Navigate with mouse or keyboard</span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">ESC to close</kbd>
        </div>
      </div>
    </div>
  );
};
