import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Users,
  Clock,
  CalendarDays,
  Banknote,
  Briefcase,
  Target,
  GraduationCap,
  Laptop,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const isEmployee = role === 'Employee';

  const navGroups: NavGroup[] = isEmployee
    ? [
        {
          group: 'MY WORKSPACE',
          items: [
            { title: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { title: 'My 360 Profile', href: `/employees/${user?.id || 'emp-003'}`, icon: Users },
            { title: 'My Attendance', href: '/attendance', icon: Clock },
            { title: 'My Leaves', href: '/leave', icon: CalendarDays, badge: 'Self-Service' },
            { title: 'My Payslips', href: '/payroll', icon: Banknote },
          ],
        },
        {
          group: 'CAREER & ASSETS',
          items: [
            { title: 'My Goals & OKRs', href: '/performance', icon: Target },
            { title: 'My IT Assets', href: '/assets', icon: Laptop },
            { title: 'My Upskilling Track', href: '/training', icon: GraduationCap },
            { title: 'Organization Tree', href: '/organization', icon: Network },
          ],
        },
      ]
    : [
        {
          group: 'CORE HR',
          items: [
            { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { title: 'Organization', href: '/organization', icon: Network },
            { title: 'Personnel Directory', href: '/employees', icon: Users, badge: '21 People' },
            { title: 'Internship Cohort', href: '/internships', icon: GraduationCap, badge: '8 Cohort' },
          ],
        },
        {
          group: 'HR OPERATIONS',
          items: [
            { title: 'Attendance', href: '/attendance', icon: Clock },
            { title: 'Leave Management', href: '/leave', icon: CalendarDays, badge: '2 Pending' },
            { title: 'Payroll & Slips', href: '/payroll', icon: Banknote },
          ],
        },
        {
          group: 'TALENT & ASSETS',
          items: [
            { title: 'Recruitment Kanban', href: '/recruitment', icon: Briefcase, badge: '5 Open' },
            { title: 'Performance (OKRs)', href: '/performance', icon: Target },
            { title: 'Skill Matrix', href: '/training', icon: GraduationCap },
            { title: 'Asset Tracking', href: '/assets', icon: Laptop },
          ],
        },
        {
          group: 'SYSTEM & ANALYTICS',
          items: [
            { title: 'Workforce Analytics', href: '/analytics', icon: BarChart3 },
            { title: 'ERPNext Settings', href: '/settings', icon: Settings },
          ],
        },
      ];

  return (
    <aside className="w-64 bg-brand-dark flex-shrink-0 border-r border-brand-border/70 flex flex-col h-full select-none relative">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/5 bg-brand-dark/70 shrink-0">
        <NavLink to="/dashboard" className="flex items-center hover:opacity-95 transition-opacity">
          <img
            src="/brand/ethx-logo-footer.png"
            alt="ETHX Softcon"
            className="h-8 w-auto object-contain max-w-[180px]"
          />
        </NavLink>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.group}>
            <p className="px-3 text-[10px] font-bold tracking-wider text-brand-slate/60 uppercase mb-1">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-brand-red text-white shadow-glow-red-sm font-bold'
                        : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5 truncate">
                        <item.icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-brand-slate group-hover:text-brand-red'
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0',
                            isActive
                              ? 'bg-black/25 text-white'
                              : 'bg-brand-card-elevated text-brand-slate group-hover:text-brand-ink border border-white/5'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Authenticated User Profile Card */}
      <div className="p-3 border-t border-white/5 bg-brand-card/60 shrink-0">
        <div className="p-2.5 rounded-xl bg-brand-card-hover border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-brand-red/40 shrink-0"
            />
            <div className="truncate">
              <p className="text-xs font-bold text-brand-ink truncate">
                {user?.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {isEmployee ? (
                  <span className="text-[9px] font-bold text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-500/30 truncate">
                    💻 Employee
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-brand-red bg-brand-red/15 px-1.5 py-0.5 rounded border border-brand-red/30 truncate">
                    👑 HR Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 rounded-lg text-brand-slate hover:text-brand-red hover:bg-brand-red/10 border border-transparent hover:border-brand-red/20 transition-all shrink-0 ml-1"
            title="Sign Out of HRMS"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
