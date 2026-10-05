import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ERPNextStatusBanner } from './ERPNextStatusBanner';
import { CommandPalette } from './CommandPalette';

export const AppLayout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-dark text-brand-ink selection:bg-brand-red selection:text-white">
      {/* Top ERPNext Server Status Bar */}
      <ERPNextStatusBanner />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Responsive Brand Sidebar (Desktop static + Mobile overlay drawer) */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-brand-dark">
          <Header
            onOpenSearch={() => setIsSearchOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
            isMobileMenuOpen={isMobileMenuOpen}
          />

          <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7 relative scroll-smooth">
            {/* Subtle background gradient glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl pointer-events-none -z-10" />
            
            <div className="max-w-[1600px] mx-auto w-full min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
