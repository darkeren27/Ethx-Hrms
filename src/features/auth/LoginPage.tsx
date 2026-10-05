import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserPlus,
  LogIn
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, registerUser, availableUsers } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('admin@ethxsoftcon.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regModality, setRegModality] = useState<'Pune HQ (Main Campus)' | 'Contract WFH (Pan-India)'>('Contract WFH (Pan-India)');
  const [regDepartment, setRegDepartment] = useState('Engineering & Cloud');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick autofill for demonstration
  const handleQuickSelect = (email: string, pass: string) => {
    setAuthMode('login');
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid credentials. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: 'Employee',
        department: regDepartment,
        designation: 'Software Engineer',
        workLocation: regModality,
      });

      if (res.success) {
        setSuccessMsg('Account created successfully! Initializing your workspace...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setError(res.message || 'Registration failed. Please check your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient glowing spheres */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-red/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-red/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-lg relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-glow-red-sm backdrop-blur">
            <img
              src="/brand/ethx-logo-footer.png"
              alt="ETHX Softcon"
              className="h-10 w-auto object-contain max-w-[200px]"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-brand-ink tracking-tight">
              Enterprise Human Resource Management
            </h1>
            <p className="text-xs text-brand-slate font-medium mt-1">
              Role-Based Access Control • Pune Global HQ & Contract WFH Network
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-brand-card/95 border border-brand-border rounded-3xl p-6 sm:p-7 shadow-card-elevated backdrop-blur relative overflow-hidden">
          {/* Top Decorative Gradient Line */}
          <div className="h-1 w-full bg-gradient-to-r from-brand-red via-brand-red-hover to-brand-red absolute top-0 left-0" />

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-brand-dark rounded-xl border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-brand-card-elevated text-brand-ink shadow-sm border border-white/10'
                  : 'text-brand-slate hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-brand-red" />
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-brand-card-elevated text-brand-ink shadow-sm border border-white/10'
                  : 'text-brand-slate hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-brand-red" />
              Create Account
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-slate mb-1">
                  Email Address or Employee ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@ethxsoftcon.com or rahul.sharma@ethxsoftcon.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-dark border border-brand-border focus:border-brand-red focus:ring-1 focus:ring-brand-red text-xs text-brand-ink placeholder-brand-slate/50 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-brand-dark border border-brand-border focus:border-brand-red focus:ring-1 focus:ring-brand-red text-xs text-brand-ink placeholder-brand-slate/50 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-slate hover:text-brand-ink p-1"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-brand-slate pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-brand-dark border-brand-border text-brand-red accent-brand-red"
                  />
                  <span>Keep me signed in</span>
                </label>
                <span className="text-brand-slate/60 text-[10px]">256-Bit TLS Secured</span>
              </div>

              <Button type="submit" className="w-full py-2.5 font-bold text-xs" isLoading={loading}>
                Sign In to My Account <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              {/* Fast 1-Click Persona Pre-fills for Easy Testing */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-slate/70 text-center">
                  Quick Demo Credentials (Click to Autofill)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('niky.sharma@ethxsoftcon.com', 'admin123')}
                    className="p-2.5 rounded-xl bg-brand-card-hover border border-white/5 hover:border-brand-red/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-ink group-hover:text-brand-red transition-colors">
                        👑 Niky Sharma
                      </span>
                      <span className="text-[9px] text-brand-red bg-brand-red/10 px-1.5 py-0.5 rounded border border-brand-red/20 font-bold">
                        HR Admin
                      </span>
                    </div>
                    <p className="text-[10px] text-brand-slate mt-0.5">niky.sharma@ethxsoftcon.com • Main HR</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSelect('krishna.tiwari@ethxsoftcon.com', 'intern123')}
                    className="p-2.5 rounded-xl bg-brand-card-hover border border-white/5 hover:border-sky-400/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-ink group-hover:text-sky-400 transition-colors">
                        💻 Krishna Tiwari
                      </span>
                      <span className="text-[9px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 font-bold">
                        Employee
                      </span>
                    </div>
                    <p className="text-[10px] text-brand-slate mt-0.5">krishna.tiwari@ethxsoftcon.com • Intern</p>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* MODE 2: CREATE ACCOUNT FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-slate mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rohit Patil"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-dark border border-brand-border focus:border-brand-red focus:ring-1 focus:ring-brand-red text-xs text-brand-ink placeholder-brand-slate/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate mb-1">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="rohit.patil@ethxsoftcon.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-dark border border-brand-border focus:border-brand-red focus:ring-1 focus:ring-brand-red text-xs text-brand-ink placeholder-brand-slate/50 outline-none"
                  />
                </div>
              </div>

              {/* Department & Work Modality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-slate mb-1">
                    Department
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-brand-dark border border-brand-border focus:border-brand-red text-xs text-brand-ink outline-none"
                  >
                    <option value="Engineering & Cloud">Engineering & Cloud</option>
                    <option value="Human Resources">Human Resources & Talent</option>
                    <option value="Finance & Payroll">Finance & Payroll</option>
                    <option value="Enterprise Sales & Growth">Enterprise Sales & Growth</option>
                    <option value="Global Operations & Support">Global Operations & Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate mb-1">
                    Work Location / Modality
                  </label>
                  <select
                    value={regModality}
                    onChange={(e) => setRegModality(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-brand-dark border border-brand-border focus:border-brand-red text-xs text-brand-ink outline-none"
                  >
                    <option value="Contract WFH (Pan-India)">💻 Contract WFH (Pan-India)</option>
                    <option value="Pune HQ (Main Campus)">🏢 Pune HQ (Main Campus)</option>
                  </select>
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-slate mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-dark border border-brand-border focus:border-brand-red text-xs text-brand-ink placeholder-brand-slate/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-dark border border-brand-border focus:border-brand-red text-xs text-brand-ink placeholder-brand-slate/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-brand-slate">
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="hover:text-brand-ink transition-colors"
                >
                  {showRegPassword ? 'Hide passwords' : 'Show passwords'}
                </button>
                <span>Password policy: Minimum 6 characters</span>
              </div>

              <Button type="submit" className="w-full py-2.5 font-bold text-xs" isLoading={loading}>
                Register Corporate Account & Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}
        </div>

        {/* Corporate Footer */}
        <div className="text-center text-xs text-brand-slate/60 flex items-center justify-center gap-3">
          <span>© 2026 ETHX Softcon Inc.</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-red" />
            ISO 27001 & SOC-2 Compliant Identity Engine
          </span>
        </div>
      </div>
    </div>
  );
};
