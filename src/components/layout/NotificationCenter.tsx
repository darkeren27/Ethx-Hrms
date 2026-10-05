import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ExternalLink, X } from 'lucide-react';
import { HRNotification } from '../../types/hrms';
import { hrmsService } from '../../services/hrmsService';

interface NotificationCenterProps {
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<HRNotification[]>([]);

  useEffect(() => {
    hrmsService.getNotifications().then(setNotifications);
  }, []);

  const handleAction = (notif: HRNotification) => {
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
      onClose();
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-brand-card border border-brand-border shadow-card-elevated z-50 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-brand-red to-brand-red-deep" />
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-red" />
          <h4 className="text-sm font-bold text-brand-ink">HR Alerts & Approvals</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="text-[11px] text-brand-slate hover:text-brand-red transition-colors flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
          <button onClick={onClose} className="text-brand-slate hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleAction(notif)}
            className={`p-3.5 hover:bg-white/5 transition-colors cursor-pointer text-left ${
              !notif.read ? 'bg-brand-red/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h5 className="text-xs font-semibold text-brand-ink">{notif.title}</h5>
              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-brand-red flex-shrink-0 mt-1" />
              )}
            </div>
            <p className="text-xs text-brand-slate mt-1 leading-relaxed">{notif.message}</p>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[10px] text-brand-slate/80">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand-slate/60" />
                {notif.timestamp}
              </span>
              {notif.actionUrl && (
                <span className="text-brand-red font-medium flex items-center gap-1">
                  Take Action <ExternalLink className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
