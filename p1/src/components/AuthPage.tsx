'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Leaf, Shield, Eye, EyeOff, ArrowRight, Phone, Mail, Lock,
  User, MapPin, Globe, ChevronDown, Fingerprint, Zap, Sprout,
  CheckCircle, Loader2, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* ───────────────────── Types ───────────────────── */
interface AuthPageProps {
  onAuthSuccess: () => void;
}

type AuthTab = 'login' | 'signup';

interface CountryData {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  states: string[];
}

/* ───────────────────── Data ───────────────────── */
const COUNTRIES: CountryData[] = [
  {
    code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸',
    states: ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Washington', 'Oregon', 'Iowa', 'Nebraska', 'Kansas']
  },
  {
    code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳',
    states: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Punjab', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Andhra Pradesh']
  },
  {
    code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱',
    states: ['South Holland', 'North Holland', 'North Brabant', 'Gelderland', 'Utrecht', 'Overijssel', 'Limburg', 'Friesland']
  },
  {
    code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺',
    states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania']
  },
  {
    code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷',
    states: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul']
  },
  {
    code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪',
    states: ['Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Lower Saxony', 'Hesse', 'Saxony']
  },
];

const ROLES = [
  { id: 'farmer', label: 'Farmer', icon: Sprout, color: '#00E676' },
  { id: 'fpo', label: 'FPO Admin', icon: Shield, color: '#2A8BF2' },
  { id: 'inspector', label: 'Inspector', icon: Eye, color: '#FF9100' },
  { id: 'buyer', label: 'Buyer', icon: Zap, color: '#00D2FF' },
  { id: 'analyst', label: 'Analyst', icon: Sparkles, color: '#E040FB' },
];

/* ───────────────────── Floating Particles ───────────────────── */
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number; color: string }[] = [];

    const throttle = (fn: Function, delay: number) => {
      let lastCall = 0;
      return function (...args: any[]) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          fn(...args);
        }
      };
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    const throttledResize = throttle(resize, 200);
    window.addEventListener('resize', throttledResize);

    const colors = ['#00E676', '#00D2FF', '#2A8BF2', '#FF9100'];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        o: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.o;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = 0.06 * (1 - dist / 120);
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', throttledResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
}

/* ───────────────────── Animated Input ───────────────────── */
function AnimatedInput({
  icon: Icon, label, type = 'text', value, onChange, placeholder, required = true, id,
}: {
  icon: React.ElementType; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean; id: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="group relative">
      <label
        htmlFor={id}
        className={`absolute left-10 transition-all duration-300 pointer-events-none ${
          focused || value
            ? '-top-2.5 text-[10px] font-bold tracking-wider text-emerald-400'
            : 'top-3 text-xs text-slate-500'
        }`}
      >
        {label}
      </label>
      <div className={`flex items-center gap-2 rounded-xl border transition-all duration-300 px-3 py-0 ${
        focused
          ? 'border-emerald-500/60 bg-slate-800/80 shadow-[0_0_20px_rgba(0,230,118,0.1)]'
          : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600/60'
      }`}>
        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
          focused ? 'text-emerald-400' : 'text-slate-600'
        }`} />
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={focused ? placeholder : ''}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className="w-full bg-transparent py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none"
          autoComplete={isPassword ? 'current-password' : 'off'}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-500 hover:text-emerald-400 transition p-1"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Animated Select ───────────────────── */
function AnimatedSelect({
  icon: Icon, label, value, onChange, options, id,
}: {
  icon: React.ElementType; label: string; value: string;
  onChange: (v: string) => void; options: { value: string; label: string }[]; id: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="absolute -top-2.5 left-10 text-[10px] font-bold tracking-wider text-emerald-400 z-10 pointer-events-none"
      >
        {label}
      </label>
      <div className={`flex items-center gap-2 rounded-xl border transition-all duration-300 px-3 ${
        focused
          ? 'border-emerald-500/60 bg-slate-800/80 shadow-[0_0_20px_rgba(0,230,118,0.1)]'
          : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600/60'
      }`}>
        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
          focused ? 'text-emerald-400' : 'text-slate-600'
        }`} />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent py-3 text-sm text-slate-100 outline-none appearance-none cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-slate-900 text-slate-100">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${
          focused ? 'text-emerald-400 rotate-180' : 'text-slate-600'
        }`} />
      </div>
    </div>
  );
}

/* ───────────────────── Social Button ───────────────────── */
function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700/40 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-600/60 transition-all duration-300 group"
    >
      {icon}
      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 transition hidden sm:inline">{label}</span>
    </button>
  );
}

/* ═══════════════════════ MAIN AUTH PAGE ═══════════════════════ */
export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [selectedRole, setSelectedRole] = useState('farmer');

  const country = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[1];

  // Update state when country changes
  useEffect(() => {
    const c = COUNTRIES.find((ct) => ct.code === selectedCountry);
    if (c && c.states.length > 0) {
      setSelectedState(c.states[0]);
    }
  }, [selectedCountry]);

  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#00E676', '#00D2FF'] });
    fire(0.2, { spread: 60, colors: ['#2A8BF2', '#FF9100'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#00E676', '#E040FB'] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#00D2FF'] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ['#FF9100', '#00E676'] });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate network request
    await new Promise((r) => setTimeout(r, 1500));

    setIsSubmitting(false);
    setShowSuccess(true);
    fireConfetti();

    // Transition to dashboard after animation
    setTimeout(() => {
      onAuthSuccess();
    }, 1200);
  };

  // ──── Success Overlay ────
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B101E] relative overflow-hidden">
        <FloatingParticles />
        <div className="relative z-10 text-center animate-[fadeInScale_0.5s_ease-out]">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-[0_0_60px_rgba(0,230,118,0.4)]">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to AgriGuard</h2>
          <p className="text-slate-400 text-sm">Initializing your dashboard...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-[progressBar_1.2s_ease-in-out]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0B101E]">
      {/* ──── Animated Background ──── */}
      <FloatingParticles />

      {/* ──── Left Hero Panel (hidden on mobile) ──── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/agri_hero_bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B101E] via-[#0B101E]/70 to-[#0B101E]/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B101E] via-transparent to-[#0B101E]/30" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,230,118,0.3)]">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">AgriGuard</h1>
              <span className="text-[10px] text-emerald-400/80 uppercase tracking-[0.2em] font-semibold">AIoT Health Platform</span>
            </div>
          </div>

          {/* Central Hero Text */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">System Online — 14 Countries Active</span>
            </div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-4">
              Intelligent<br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Farm Guardian
              </span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Precision food safety monitoring, AI-powered produce grading, geo-aware edge intelligence,
              and blockchain traceability — all from a single command center.
            </p>

            {/* Stats Row */}
            <div className="flex gap-6 mt-8">
              {[
                { value: '2.4M+', label: 'Batches Tracked', color: 'text-emerald-400' },
                { value: '99.7%', label: 'Grade Accuracy', color: 'text-cyan-400' },
                { value: '340+', label: 'Edge Nodes', color: 'text-blue-400' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="flex items-center gap-3 text-slate-600">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest">AES-256 Encrypted • SOC 2 Compliant • GDPR Ready</span>
          </div>
        </div>
      </div>

      {/* ──── Right Auth Panel ──── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile Brand (shown only on small screens) */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,230,118,0.3)]">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">AgriGuard</h1>
              <span className="text-[9px] text-emerald-400/80 uppercase tracking-[0.2em] font-semibold">AIoT Health Platform</span>
            </div>
          </div>

          {/* ──── Tab Switcher ──── */}
          <div className="relative flex bg-slate-900/60 rounded-2xl p-1 mb-8 border border-slate-800/50">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-emerald-600/90 to-cyan-600/90 shadow-[0_0_20px_rgba(0,230,118,0.2)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
              style={{ left: activeTab === 'login' ? '4px' : 'calc(50% + 0px)' }}
            />
            {(['login', 'signup'] as AuthTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 relative z-10 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors duration-300 rounded-xl ${
                  activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* ──── LOGIN FORM ──── */}
          {activeTab === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Welcome back</h3>
                <p className="text-sm text-slate-500">Enter your credentials to access your dashboard</p>
              </div>

              <AnimatedInput
                id="login-email"
                icon={Mail}
                label="Email or Phone"
                type="text"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="you@farm.com"
              />

              <AnimatedInput
                id="login-password"
                icon={Lock}
                label="Password"
                type="password"
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="••••••••"
              />

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-slate-700 group-hover:border-emerald-500/50 transition flex items-center justify-center">
                    <input type="checkbox" className="sr-only peer" />
                  </div>
                  Remember me
                </label>
                <a href="#" className="text-emerald-400 hover:text-emerald-300 font-semibold transition">
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full relative group overflow-hidden rounded-xl py-3.5 font-bold text-sm uppercase tracking-wider text-white transition-all duration-300 disabled:opacity-60"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 transition-all duration-300 group-hover:from-emerald-500 group-hover:to-cyan-500" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                <span className="px-4 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Or continue with</span>
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              </div>

              {/* Social Logins */}
              <div className="flex gap-3">
                <SocialButton
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  }
                  label="Google"
                />
                <SocialButton
                  icon={
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.97.08 2.14-.52 2.82-1.33z"/>
                    </svg>
                  }
                  label="Apple"
                />
                <SocialButton
                  icon={
                    <svg className="w-4 h-4 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  }
                  label="Facebook"
                />
              </div>

              {/* Biometric Option */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
              >
                <Fingerprint className="w-4 h-4" />
                Sign in with biometrics
              </button>
            </form>
          )}

          {/* ──── SIGNUP FORM ──── */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-[fadeIn_0.4s_ease-out]">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Join AgriGuard</h3>
                <p className="text-sm text-slate-500">Create your account to get started</p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">Select Your Role</label>
                <div className="flex gap-2 flex-wrap">
                  {ROLES.map((role) => {
                    const RIcon = role.icon;
                    const isActive = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                          isActive
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(0,230,118,0.1)]'
                            : 'border-slate-700/40 bg-slate-900/30 text-slate-500 hover:border-slate-600/50 hover:text-slate-300'
                        }`}
                      >
                        <RIcon className="w-3.5 h-3.5" style={{ color: isActive ? role.color : undefined }} />
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <AnimatedInput
                  id="signup-first"
                  icon={User}
                  label="First Name"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="John"
                />
                <AnimatedInput
                  id="signup-last"
                  icon={User}
                  label="Last Name"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Doe"
                />
              </div>

              {/* Email */}
              <AnimatedInput
                id="signup-email"
                icon={Mail}
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@farm.com"
              />

              {/* Country & State */}
              <div className="grid grid-cols-2 gap-3">
                <AnimatedSelect
                  id="signup-country"
                  icon={Globe}
                  label="Country"
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))}
                />
                <AnimatedSelect
                  id="signup-state"
                  icon={MapPin}
                  label="State"
                  value={selectedState}
                  onChange={setSelectedState}
                  options={country.states.map((s) => ({ value: s, label: s }))}
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <label className="absolute -top-2.5 left-10 text-[10px] font-bold tracking-wider text-emerald-400 z-10 pointer-events-none">
                  Phone Number
                </label>
                <div className="flex items-center gap-0 rounded-xl border border-slate-700/50 bg-slate-900/50 hover:border-slate-600/60 transition-all duration-300 overflow-hidden">
                  <div className="flex items-center gap-1 px-3 py-3 bg-slate-800/50 border-r border-slate-700/50 text-sm text-slate-400 font-semibold shrink-0">
                    <span>{country.flag}</span>
                    <span className="text-xs">{country.dialCode}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 flex-1">
                    <Phone className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      required
                      className="w-full bg-transparent py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-3">
                <AnimatedInput
                  id="signup-pass"
                  icon={Lock}
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                />
                <AnimatedInput
                  id="signup-confirm"
                  icon={Lock}
                  label="Confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                />
              </div>

              {/* Password Strength Indicators */}
              {password && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        password.length >= i * 3
                          ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-orange-500' : i <= 3 ? 'bg-yellow-500' : 'bg-emerald-500'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-2 text-[11px] text-slate-500 cursor-pointer group">
                <div className="w-4 h-4 mt-0.5 rounded border border-slate-700 group-hover:border-emerald-500/50 transition flex-shrink-0 flex items-center justify-center">
                  <input type="checkbox" className="sr-only" required />
                </div>
                <span>
                  I agree to the <a href="#" className="text-emerald-400 hover:underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-emerald-400 hover:underline">Privacy Policy</a>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full relative group overflow-hidden rounded-xl py-3.5 font-bold text-sm uppercase tracking-wider text-white transition-all duration-300 disabled:opacity-60"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 transition-all duration-300 group-hover:from-emerald-500 group-hover:to-cyan-500" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              © 2026 AgriGuard AIoT Platform • AES-256 Encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
