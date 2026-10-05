import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Clock, 
  CheckCircle, 
  Command,
  LogOut,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hrmsService } from '../../services/hrmsService';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  onOpenSearch: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenSearch,
  onToggleMobileMenu,
  isMobileMenuOpen = false
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickPunch = async () => {
    if (!user) return;
    setIsPunching(true);
    try {
      await hrmsService.punchAttendance(
        user.employeeId || 'ETHX-001',
        user.name,
        user.department || 'General',
        isCheckedIn ? 'OUT' : 'IN'
      );
      setIsCheckedIn(!isCheckedIn);
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <header className="h-16 bg-brand-dark/95 backdrop-blur border-b border-brand-border/70 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Mobile menu toggle + Logo (<lg) + Search trigger */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-md">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-brand-card hover:bg-brand-card-hover border border-brand-border text-brand-slate hover:text-brand-ink transition-colors shrink-0"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo */}
        <NavLink to="/dashboard" className="lg:hidden flex items-center shrink-0 mr-1 sm:mr-2 hover:opacity-95 transition-opacity">
          <img
            src="/brand/ethx-logo-footer.png"
            alt="ETHX Softcon"
            className="h-6 sm:h-7 w-auto object-contain max-w-[110px] sm:max-w-[140px]"
          />
        </NavLink>

        {/* Global Search trigger (Ctrl+K) */}
        <button
          onClick={onOpenSearch}
          className="flex-1 min-w-0 flex items-center justify-between px-2.5 sm:px-3.5 py-2 rounded-xl bg-brand-card-hover/80 hover:bg-brand-card-elevated border border-brand-border text-xs text-brand-slate hover:text-brand-ink transition-all group"
          aria-label="Search employees, documents, leave"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-brand-slate group-hover:text-brand-red transition-colors shrink-0" />
            <span className="hidden sm:inline truncate">Search employees, documents, leave...</span>
            <span className="sm:hidden text-[11px] truncate">Search...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-brand-slate shrink-0">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Live Attendance Web Punch Widget */}
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-brand-card border border-brand-border">
          <div className="flex items-center gap-1.5 text-xs font-mono text-brand-slate">
            <Clock className="w-3.5 h-3.5 text-brand-red" />
            <span>{currentTime.toLocaleTimeString('en-US', { hour12: true })}</span>
          </div>

          <button
            onClick={handleQuickPunch}
            disabled={isPunching}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isCheckedIn
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-brand-red text-white hover:bg-brand-red-deep shadow-glow-red-sm'
            }`}
          >
            {isCheckedIn ? (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Checked In</span>
              </>
            ) : (
              <span>Web Punch</span>
            )}
          </button>
        </div>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-brand-card hover:bg-brand-card-hover border border-brand-border text-brand-slate hover:text-brand-ink transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red ring-2 ring-brand-dark animate-pulse" />
          </button>

          {showNotifications && (
            <NotificationCenter onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Sign Out Action */}
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="p-2 rounded-xl bg-brand-card hover:bg-brand-red/15 border border-brand-border hover:border-brand-red/40 text-brand-slate hover:text-brand-red transition-all"
          title="Sign Out of HRMS"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
