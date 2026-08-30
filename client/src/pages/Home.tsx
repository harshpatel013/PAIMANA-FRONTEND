/**
 * Civic Ledger design reminder: evidence-first government intelligence UI.
 * Use paper surfaces, ink typography, mineral teal actions, and local risk signals.
 */
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import LocalizationLayer from "@/components/LocalizationLayer";
import ProjectDossier from "@/components/ProjectDossier";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  CircleUserRound,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  KeyRound,
  Languages,
  LineChart as LineChartIcon,
  Loader2,
  LogOut,
  Mail,
  MapPinned,
  Menu,
  Moon,
  MoreHorizontal,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Sun,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Role = "MONITORING_OFFICER" | "MINISTER" | "MINISTRY_OFFICER" | "PROJECT_OFFICER";
type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
type Language = "EN" | "HI";
type TextSize = "STANDARD" | "COMFORTABLE";

const ASSETS = {
  logo: "/manus-storage/paimana-beacon-logo_54c6f100.png",
  contour: "/manus-storage/paimana-infrastructure-contour_2b7edd11.png",
  aerial: "/manus-storage/paimana-project-aerial_9090a182.png",
  atlas: "/manus-storage/paimana-risk-atlas_1cd32a1a.png",
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
let liveDashboard: any = null;

const roleMeta: Record<Role, { title: string; short: string; description: string; icon: typeof ShieldAlert }> = {
  MINISTER: {
    title: "Minister / Senior Leadership",
    short: "Minister",
    description: "National portfolio, critical signals, and executive briefing.",
    icon: Building2,
  },
  MONITORING_OFFICER: {
    title: "Senior Monitoring Officer",
    short: "Monitoring Officer",
    description: "Portfolio investigations, early warnings, and intelligence.",
    icon: ShieldAlert,
  },
  MINISTRY_OFFICER: {
    title: "Ministry / Department Officer",
    short: "Ministry Officer",
    description: "Your ministry portfolio, warnings, and projects.",
    icon: BriefcaseBusiness,
  },
  PROJECT_OFFICER: {
    title: "Project / Implementing Agency Officer",
    short: "Project Officer",
    description: "Delivery progress, milestones, and alerts for assigned projects.",
    icon: Target,
  },
};

const riskStyles: Record<RiskLevel, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MODERATE: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
};

const riskDot: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500",
  MODERATE: "bg-amber-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

const navItems = [
  { label: "Command Center", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Projects", icon: ClipboardList, path: "/projects" },
  { label: "Early Warnings", icon: AlertTriangle, path: "/early-warnings" },
  { label: "Risk Intelligence", icon: Gauge, path: "/risk" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "AI Assistant", icon: Bot, path: "/assistant" },
];

const rolePermissions: Record<Role, string[]> = {
  MINISTER: ["/dashboard", "/projects", "/early-warnings", "/analytics", "/assistant", "/settings"],
  MONITORING_OFFICER: ["/dashboard", "/projects", "/early-warnings", "/risk", "/analytics", "/assistant", "/settings"],
  MINISTRY_OFFICER: ["/dashboard", "/projects", "/early-warnings", "/risk", "/analytics", "/assistant", "/settings"],
  PROJECT_OFFICER: ["/dashboard", "/projects", "/early-warnings", "/assistant", "/settings"],
};

const roleSwitchPermissions: Record<Role, Role[]> = {
  MINISTER: ["MINISTER", "MONITORING_OFFICER", "MINISTRY_OFFICER", "PROJECT_OFFICER"],
  MONITORING_OFFICER: ["MONITORING_OFFICER", "MINISTRY_OFFICER", "PROJECT_OFFICER"],
  MINISTRY_OFFICER: ["MINISTRY_OFFICER", "PROJECT_OFFICER"],
  PROJECT_OFFICER: ["PROJECT_OFFICER"],
};

const navigationLabels: Record<Language, Record<string, string>> = {
  EN: { "Command Center": "Command Center", Projects: "Projects", "Early Warnings": "Early Warnings", "Risk Intelligence": "Risk Intelligence", Analytics: "Analytics", "AI Assistant": "AI Assistant", Settings: "Settings" },
  HI: { "Command Center": "कमांड सेंटर", Projects: "परियोजनाएँ", "Early Warnings": "पूर्व चेतावनियाँ", "Risk Intelligence": "जोखिम विश्लेषण", Analytics: "विश्लेषण", "AI Assistant": "एआई सहायक", Settings: "सेटिंग्स" },
};

let projects = [
  { id: "619073", name: "Eastern Freight Corridor", ministry: "Railways", sector: "Transport & Logistics", state: "Uttar Pradesh", progress: 52, cost: "₹1,180 Cr", score: 91, risk: "CRITICAL" as RiskLevel, issue: "Schedule delay" },
  { id: "619152", name: "National Highway Expansion", ministry: "Road Transport & Highways", sector: "Transport & Logistics", state: "Maharashtra", progress: 64, cost: "₹2,460 Cr", score: 88, risk: "CRITICAL" as RiskLevel, issue: "Cost exposure" },
  { id: "618520", name: "River Basin Water Grid", ministry: "Jal Shakti", sector: "Water & Sanitation", state: "Rajasthan", progress: 48, cost: "₹920 Cr", score: 84, risk: "CRITICAL" as RiskLevel, issue: "Progress gap" },
  { id: "619168", name: "Coastal Transmission Link", ministry: "Power", sector: "Energy", state: "Tamil Nadu", progress: 68, cost: "₹780 Cr", score: 72, risk: "HIGH" as RiskLevel, issue: "Milestone slip" },
  { id: "619142", name: "Rural Digital Backbone", ministry: "Communications", sector: "Communication", state: "Assam", progress: 76, cost: "₹390 Cr", score: 54, risk: "HIGH" as RiskLevel, issue: "Implementation" },
  { id: "619184", name: "Integrated Steel Terminal", ministry: "Steel", sector: "Industry", state: "Odisha", progress: 83, cost: "₹1,050 Cr", score: 39, risk: "MODERATE" as RiskLevel, issue: "Cost variance" },
];

let riskDistribution = [
  { name: "Low", value: 1313, color: "#1F9D72" },
  { name: "Moderate", value: 421, color: "#D7A93C" },
  { name: "High", value: 184, color: "#D97722" },
  { name: "Critical", value: 63, color: "#CE4A42" },
];

let riskTrend: any[] = [];
let sectorRisk: any[] = [];

const progressTrend = [
  { month: "Jan", planned: 30, actual: 27 },
  { month: "Feb", planned: 40, actual: 34 },
  { month: "Mar", planned: 52, actual: 41 },
  { month: "Apr", planned: 61, actual: 46 },
  { month: "May", planned: 66, actual: 49 },
  { month: "Jun", planned: 70, actual: 52 },
];

function RiskBadge({ level, score, compact = false }: { level: RiskLevel; score?: number; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] ${riskStyles[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${riskDot[level]}`} />
      {compact ? level.slice(0, 4) : level}{score !== undefined ? ` · ${score}` : ""}
    </span>
  );
}

function DataStamp({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{children}</span>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`ledger-panel ${className}`}>{children}</section>;
}

function MetricCard({ label, value, detail, trend, alert, onClick }: { label: string; value: string; detail: string; trend?: string; alert?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`metric-card text-left ${onClick ? "metric-clickable" : ""} ${alert ? "metric-alert" : ""}`}>
      <div className="mb-7 flex items-start justify-between gap-3">
        <DataStamp>{label}</DataStamp>
        <span className={`h-2 w-2 rounded-full ${alert ? "bg-red-500" : "bg-teal-700"}`} />
      </div>
      <div className="font-mono text-[30px] font-semibold leading-none tracking-[-0.07em] text-[#172033]">{value}</div>
      <div className="mt-2 text-[12px] font-medium text-slate-500">{detail}</div>
      {trend && <div className={`mt-4 flex items-center gap-1 text-[11px] font-semibold ${alert ? "text-red-600" : "text-emerald-700"}`}>{alert ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{trend}</div>}
    </button>
  );
}

function LogoLockup({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={ASSETS.logo} alt="PAIMANA-AI survey beacon" className={small ? "h-7 w-7" : "h-9 w-9"} />
      <div>
        <div className={`${small ? "text-[13px]" : "text-[15px]"} font-extrabold leading-none tracking-[-0.04em] text-[#172033]`}>PAIMANA<span className="text-teal-700">-AI</span></div>
        {!small && <div className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">Infrastructure Intelligence</div>}
      </div>
    </div>
  );
}

function InterfaceControls({ language, setLanguage, compact = false }: { language: Language; setLanguage: (language: Language) => void; compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  return <div className={`interface-controls ${compact ? "interface-controls-compact" : ""}`}><div className="language-switch" aria-label="Interface language"><Languages size={14} /><button onClick={() => setLanguage("EN")} className={language === "EN" ? "language-active" : ""}>EN</button><span>/</span><button onClick={() => setLanguage("HI")} className={language === "HI" ? "language-active" : ""}>हिं</button></div><button onClick={toggleTheme} className="theme-switch" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={15} /> : <Sun size={15} />}<span className="hidden xl:inline">{theme === "light" ? "Dark" : "Light"}</span></button></div>;
}

function LoginScreen({ onEnter, language, setLanguage }: { onEnter: (role: Role) => void; language: Language; setLanguage: (language: Language) => void }) {
  const [selected, setSelected] = useState<Role>("MONITORING_OFFICER");
  const [mode, setMode] = useState<"signin" | "recovery" | "sent">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const resetToSignIn = () => { setMode("signin"); setError(""); setIsLoading(false); };
  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEmailValid) { setError("Enter a valid official email address to continue."); return; }
    if (password.trim().length < 4) { setError("Enter your password to continue."); return; }
    setError("");
    setIsLoading(true);
    window.setTimeout(() => {
      if (email.toLowerCase().includes("error")) { setIsLoading(false); setError("We could not verify those sign-in details. Review the email and password, then try again."); return; }
      onEnter(selected);
    }, 650);
  };
  const recoverPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEmailValid) { setError("Enter a valid official email address to request recovery."); return; }
    setError("");
    setIsLoading(true);
    window.setTimeout(() => { setIsLoading(false); setMode("sent"); }, 600);
  };
  return <main className="login-shell">
    <section className="login-brand">
      <div className="login-image" style={{ backgroundImage: `url(${ASSETS.contour})` }} />
      <div className="relative z-10 flex h-full flex-col justify-between p-8 sm:p-12"><LogoLockup /><div className="max-w-xl pb-8"><DataStamp>Decision support workspace</DataStamp><h1 className="mt-5 max-w-lg text-4xl font-extrabold leading-[1.05] tracking-[-0.055em] text-[#172033] sm:text-6xl">Evidence for the work that moves the nation.</h1><p className="mt-6 max-w-md text-[15px] leading-7 text-slate-600">A role-aware intelligence platform for finding emerging project risk, examining contributing conditions, and focusing timely review.</p><div className="mt-9 flex items-center gap-3 text-[11px] font-semibold text-slate-600"><span className="h-px w-12 bg-teal-700" /> PREDICT <span className="text-slate-300">/</span> EXPLAIN <span className="text-slate-300">/</span> WARN <span className="text-slate-300">/</span> ACT</div></div></div>
    </section>
    <section className="relative flex min-h-[620px] items-center justify-center bg-[#f6f8fb] px-5 py-10 sm:px-12"><div className="login-preferences"><InterfaceControls language={language} setLanguage={setLanguage} compact /></div><div className="w-full max-w-[480px]">
      {mode === "signin" && <><div className="mb-7"><DataStamp>PAIMANA-AI DEMO ACCESS</DataStamp><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[#172033]">Sign in to a workspace.</h2><p className="mt-3 text-sm leading-6 text-slate-500">Choose the monitoring context you want to review, then enter demo credentials.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{(Object.keys(roleMeta) as Role[]).map((role) => { const ItemIcon = roleMeta[role].icon; const active = selected === role; return <button key={role} onClick={() => setSelected(role)} className={`role-card role-card-compact text-left ${active ? "role-card-active" : ""}`}><div className="flex items-start justify-between"><ItemIcon size={19} strokeWidth={1.7} className={active ? "text-teal-700" : "text-slate-500"} /><span className={`mt-1 h-2 w-2 rounded-full ${active ? "bg-teal-700" : "bg-slate-200"}`} /></div><div className="mt-4 text-[12px] font-bold tracking-[-0.02em] text-[#172033]">{roleMeta[role].title}</div></button>; })}</div><form onSubmit={signIn} className="login-form mt-6"><label>Official email address<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@department.gov.in" aria-invalid={Boolean(error)} /></label><label>Password<div className="relative"><KeyRound size={15} className="absolute left-3 top-3 text-slate-400" /><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" placeholder="Enter your password" aria-invalid={Boolean(error)} /></div></label>{error && <div role="alert" className="login-alert"><AlertTriangle size={15} />{error}</div>}<div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-teal-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Demo workspace</span><button type="button" onClick={() => { setError(""); setMode("recovery"); }} className="text-[11px] font-bold text-teal-700 hover:underline">Forgot Password?</button></div><Button disabled={isLoading} type="submit" className="h-12 w-full rounded-xl bg-[#0b695c] text-sm font-bold text-white shadow-[0_10px_24px_rgba(11,105,92,0.18)] hover:bg-[#095b50] disabled:opacity-75">{isLoading ? <><Loader2 className="mr-2 animate-spin" size={16} /> Checking access…</> : <>Sign in as {roleMeta[selected].short}<ArrowUpRight className="ml-2" size={16} /></>}</Button></form><p className="mt-5 text-center text-[11px] leading-5 text-slate-500">Use any valid email and a password of four or more characters for this prototype. Enter an email containing “error” to review the sign-in error state.</p></>}
      {mode === "recovery" && <><button onClick={resetToSignIn} className="mb-6 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-teal-700"><ArrowLeft size={14} /> Back to sign in</button><DataStamp>Password recovery</DataStamp><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[#172033]">Recover your access.</h2><p className="mt-3 text-sm leading-6 text-slate-500">Enter the official email associated with your PAIMANA-AI account. We will send recovery instructions if the account is registered.</p><form onSubmit={recoverPassword} className="login-form mt-7"><label>Official email address<div className="relative"><Mail size={15} className="absolute left-3 top-3 text-slate-400" /><Input autoFocus type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" placeholder="name@department.gov.in" aria-invalid={Boolean(error)} /></div></label>{error && <div role="alert" className="login-alert"><AlertTriangle size={15} />{error}</div>}<Button disabled={isLoading} type="submit" className="h-12 w-full rounded-xl bg-[#0b695c] text-sm font-bold text-white shadow-[0_10px_24px_rgba(11,105,92,0.18)] hover:bg-[#095b50] disabled:opacity-75">{isLoading ? <><Loader2 className="mr-2 animate-spin" size={16} /> Sending recovery link…</> : <>Send recovery instructions <Mail className="ml-2" size={16} /></>}</Button></form><p className="mt-5 text-center text-[11px] leading-5 text-slate-500">For security, the recovery result does not reveal whether an email address is registered.</p></>}
      {mode === "sent" && <div className="recovery-sent"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck size={25} /></span><DataStamp>Recovery request recorded</DataStamp><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[#172033]">Check your inbox.</h2><p className="mt-3 text-sm leading-6 text-slate-500">If an account is associated with <strong className="font-bold text-[#172033]">{email}</strong>, password recovery instructions will be sent shortly.</p><Button onClick={resetToSignIn} variant="outline" className="mt-7 h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-bold text-teal-800 hover:bg-teal-50">Return to sign in</Button></div>}
    </div></section>
  </main>;
}

function AppShell({ role, requestRole, onSignOut, language, setLanguage, children }: { role: Role; requestRole: (role: Role) => void; onSignOut: () => void; language: Language; setLanguage: (language: Language) => void; children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);
  const allowedNav = navItems.filter((item) => rolePermissions[role].includes(item.path));
  const isActive = (path: string) => location === path || (path === "/projects" && location.startsWith("/projects/"));
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <aside className={`app-sidebar ${open ? "app-sidebar-open" : ""}`}>
        <div className="px-5 pb-5 pt-6"><LogoLockup small /></div>
        <div className="mx-5 border-t border-slate-200/80" />
        <nav className="px-3 py-5">
          <DataStamp>Workspace</DataStamp>
          <div className="mt-3 space-y-1">
            {allowedNav.map((item) => {
              const ItemIcon = item.icon;
              return <button key={item.path} onClick={() => { navigate(item.path); setOpen(false); }} className={`nav-item ${isActive(item.path) ? "nav-item-active" : ""}`}><ItemIcon size={17} strokeWidth={1.8} /> <span>{navigationLabels[language][item.label]}</span></button>;
            })}
          </div>
        </nav>
        <div className="mt-auto border-t border-slate-200/80 px-3 py-4">
          <button onClick={() => navigate("/settings")} className={`nav-item ${isActive("/settings") ? "nav-item-active" : ""}`}><Settings size={17} /> <span>{navigationLabels[language].Settings}</span></button>
          <div className="mx-2 mt-5 rounded-xl bg-[#ffd9c2]/50 p-3.5">
            <DataStamp>Portfolio snapshot</DataStamp>
            <div className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">Monitoring data current to April 2026.</div>
          </div>
        </div>
      </aside>
      {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <div className="app-frame">
        <header className="app-topbar">
          <button className="mr-2 rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="topbar-brand"><LogoLockup small /><span className="hidden border-l border-slate-200 pl-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 xl:inline">National monitoring</span></div>
          <div className="top-search ml-4 hidden max-w-[390px] md:flex"><Search size={16} /><Input aria-label="Search projects" placeholder="Search project, ministry, sector..." onFocus={() => navigate("/projects")} /></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <InterfaceControls language={language} setLanguage={setLanguage} />
            <button onClick={() => navigate("/projects")} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700 md:hidden" aria-label="Search"><Search size={19} /></button>
            <button onClick={() => navigate("/early-warnings")} className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700" aria-label="View notifications"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" /></button>
            <div className="relative">
              <button onClick={() => setRoleMenu(!roleMenu)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition-colors hover:border-teal-200">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b695c] font-mono text-[10px] font-bold text-white">MO</span>
                <span className="hidden max-w-[130px] truncate text-left sm:block"><span className="block text-[11px] font-bold leading-none text-[#172033]">Review desk</span><span className="mt-1 block text-[10px] leading-none text-slate-500">Signed in · {roleMeta[role].short}</span></span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {roleMenu && <div className="role-menu profile-menu">
                <div className="profile-menu-header"><span className="profile-avatar">AS</span><div className="min-w-0"><div className="truncate text-[12px] font-bold text-[#172033]">Aarav Sharma</div><div className="mt-1 truncate text-[10px] text-slate-500">aarav.sharma@paimana.gov.in</div></div></div>
                <div className="session-indicator"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Session active</div>
                <div className="profile-role"><UserRound size={14} /><div><DataStamp>Active role</DataStamp><div className="mt-1 text-[11px] font-bold text-[#172033]">{roleMeta[role].title}</div></div></div>
                <div className="menu-separator" />
                <DataStamp>Switch workspace role</DataStamp>
                {(Object.keys(roleMeta) as Role[]).map((key) => <button key={key} onClick={() => { if (key !== role) requestRole(key); setRoleMenu(false); }} className={`role-menu-item ${key === role ? "role-menu-selected" : ""}`}>{roleMeta[key].short}{key === role && <Check size={14} />}</button>)}
                <div className="menu-separator" />
                <button onClick={() => { setRoleMenu(false); onSignOut(); }} className="signout-menu-item"><LogOut size={14} /> Sign out of PAIMANA-AI</button>
              </div>}
            </div>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="page-intro mb-7 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end"><div><DataStamp>{eyebrow}</DataStamp><h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.055em] text-[#172033] sm:text-[34px]">{title}</h1><p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">{subtitle}</p></div>{action}</div>;
}

function Dashboard({ role, navigate }: { role: Role; navigate: (path: string) => void }) {
  const presentation = {
    MINISTER: { eyebrow: "NATIONAL PORTFOLIO · EXECUTIVE VIEW", title: "Infrastructure Portfolio", subtitle: "A concise national perspective on signals that warrant senior review." },
    MONITORING_OFFICER: { eyebrow: "COMMAND CENTER · MONITORING VIEW", title: "National Infrastructure Portfolio", subtitle: "Monitor project health, emerging risks, and early warnings across the active portfolio." },
    MINISTRY_OFFICER: { eyebrow: "MINISTRY PORTFOLIO · AUTHORISED SCOPE", title: "Your Ministry Portfolio", subtitle: "Review projects, emerging exceptions, and intelligence within your authorised monitoring scope." },
    PROJECT_OFFICER: { eyebrow: "PROJECT DELIVERY · EXECUTION VIEW", title: "Assigned Project Portfolio", subtitle: "Focus on progress, upcoming milestones, and early risk signals across your assigned projects." },
  }[role];
  const roleProjects = liveDashboard ? Number(liveDashboard.total_projects).toLocaleString("en-IN") : (role === "PROJECT_OFFICER" ? "12" : role === "MINISTRY_OFFICER" ? "128" : "1,981");
  const titleCritical = liveDashboard ? Number(liveDashboard.risk_distribution?.HIGH ?? 0).toLocaleString("en-IN") : (role === "PROJECT_OFFICER" ? "2" : role === "MINISTRY_OFFICER" ? "8" : "63");
  return <>
    <PageIntro eyebrow={presentation.eyebrow} title={presentation.title} subtitle={presentation.subtitle} action={<div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"><CalendarClock size={15} className="text-teal-700" /><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Snapshot · Apr 2026</span></div>} />
    <section className="scope-ribbon" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.84) 53%, rgba(255,255,255,0.45) 100%), url(${ASSETS.contour})` }}>
      <div><DataStamp>Portfolio signal</DataStamp><p className="mt-2 max-w-lg text-[15px] font-bold leading-6 text-[#172033]">{role === "PROJECT_OFFICER" ? "Two assigned projects carry high-priority delivery conditions." : "Transport & Logistics continues to carry the highest sector-level portfolio risk."}</p></div>
      <Button variant="outline" onClick={() => navigate(role === "MINISTER" ? "/analytics" : "/projects")} className="border-[#0b695c]/20 bg-white/80 text-xs font-bold text-teal-800 hover:bg-white">{role === "MINISTER" ? "View sector analysis" : "Investigate portfolio"}<ArrowUpRight className="ml-2" size={14} /></Button>
    </section>
    <section className="metric-grid mt-5">
      <MetricCard label={role === "PROJECT_OFFICER" ? "Assigned projects" : "Total projects"} value={roleProjects} detail={role === "PROJECT_OFFICER" ? "Active delivery assignments" : "Active monitored portfolio"} trend={role === "PROJECT_OFFICER" ? "7 milestones due" : "2.6% since prior period"} />
      <MetricCard label="Critical projects" value={titleCritical} detail="Requiring immediate review" trend="8.4% since prior period" alert onClick={() => navigate("/projects?risk=critical")} />
      <MetricCard label={role === "PROJECT_OFFICER" ? "Delayed" : "High risk"} value={role === "PROJECT_OFFICER" ? "3" : role === "MINISTRY_OFFICER" ? "23" : "184"} detail={role === "PROJECT_OFFICER" ? "Projects past key dates" : "Elevated monitoring conditions"} trend="2.1% since prior period" alert />
      <MetricCard label={role === "PROJECT_OFFICER" ? "Progress" : "Average risk"} value={role === "PROJECT_OFFICER" ? "72%" : role === "MINISTRY_OFFICER" ? "52%" : "47.2"} detail={role === "PROJECT_OFFICER" ? "Across assigned projects" : "Portfolio risk score"} trend="3.0 pp since prior period" alert />
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel className="p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><DataStamp>Risk distribution</DataStamp><h2 className="mt-1 text-[18px] font-bold tracking-[-0.03em]">Portfolio signal mix</h2></div><button onClick={() => navigate("/projects")} className="text-[11px] font-bold text-teal-700 hover:underline">Explore projects</button></div><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={66} outerRadius={92} paddingAngle={3} stroke="none">{riskDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><text x="50%" y="48%" textAnchor="middle" className="fill-slate-900 text-[22px] font-semibold">1,981</text><text x="50%" y="58%" textAnchor="middle" className="fill-slate-500 text-[10px]">PROJECTS</text></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-4">{riskDistribution.map((item) => <button key={item.name} onClick={() => navigate(item.name === "Critical" ? "/projects?risk=critical" : "/projects")} className="flex items-center gap-2 text-left"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} /><span><span className="block font-mono text-xs font-bold text-slate-700">{item.value.toLocaleString()}</span><span className="text-[10px] text-slate-500">{item.name}</span></span></button>)}</div></Panel>
      <Panel className="p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><DataStamp>Risk trajectory</DataStamp><h2 className="mt-1 text-[18px] font-bold tracking-[-0.03em]">Portfolio risk trend</h2></div><span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"><ArrowUpRight size={12} /> 13.2%</span></div><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={riskTrend} margin={{ top: 8, right: 2, left: -20, bottom: 0 }}><defs><linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b695c" stopOpacity={0.2} /><stop offset="95%" stopColor="#0b695c" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#667085" }} /><YAxis domain={[20, 60]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Area dataKey="risk" stroke="#0b695c" strokeWidth={2.5} fill="url(#riskFill)" /></AreaChart></ResponsiveContainer></div><div className="mt-1 rounded-xl bg-[#f6f8fb] p-3 text-[11px] leading-5 text-slate-600"><span className="font-bold text-[#172033]">Interpretation: </span>the overall risk trend has increased across the last six reporting periods, with schedule conditions as the primary driver.</div></Panel>
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
      <Panel className="p-5 sm:p-6"><div className="mb-5"><DataStamp>Sector comparison</DataStamp><h2 className="mt-1 text-[18px] font-bold tracking-[-0.03em]">Highest risk sectors</h2></div><div className="h-[282px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={sectorRisk} layout="vertical" margin={{ top: 2, right: 36, left: 6, bottom: 0 }}><XAxis type="number" domain={[0, 80]} hide /><YAxis dataKey="sector" type="category" axisLine={false} tickLine={false} width={84} tick={{ fontSize: 10.5, fill: "#475467", fontWeight: 600 }} /><Tooltip cursor={{ fill: "#f6f8fb" }} contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Bar dataKey="risk" radius={[0, 5, 5, 0]} barSize={14}>{sectorRisk.map((item) => <Cell key={item.sector} fill={item.risk > 60 ? "#cf6255" : item.risk > 50 ? "#d98552" : "#0b695c"} />)}</Bar></BarChart></ResponsiveContainer></div><button onClick={() => navigate("/analytics")} className="mt-1 flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline">Compare sector performance <ArrowUpRight size={13} /></button></Panel>
      <Panel className="ledger-register overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between sm:px-6"><div><DataStamp>Priority register</DataStamp><h2 className="mt-1 text-[18px] font-bold tracking-[-0.03em]">Critical projects</h2></div><button onClick={() => navigate("/projects?risk=critical")} className="text-left text-[11px] font-bold text-teal-700 hover:underline">Inspect critical register</button></div><ProjectTable rows={projects.slice(0, 4)} navigate={navigate} compact /></Panel>
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel className="executive-brief relative overflow-hidden p-5 sm:p-6"><img src={ASSETS.atlas} alt="Abstract infrastructure risk atlas" className="executive-brief-visual absolute bottom-0 right-0 h-full w-[48%] object-cover opacity-[0.17] mix-blend-multiply" /><div className="executive-brief-copy relative z-10 max-w-[500px]"><DataStamp>AI executive briefing</DataStamp><h2 className="mt-2 text-[21px] font-bold tracking-[-0.04em]">The portfolio is signalling a schedule-led concentration of risk.</h2><p className="mt-3 text-[13px] leading-6 text-slate-600">There are <strong className="font-bold text-[#172033]">63 critical projects</strong> requiring attention. Transport & Logistics has the highest average sector risk, and milestone slippage is the most frequent condition appearing in critical project explanations.</p><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => navigate("/projects?risk=critical")} className="h-9 rounded-lg bg-[#0b695c] px-3 text-[11px] font-bold text-white hover:bg-[#095b50]">Review critical projects</Button><Button variant="outline" onClick={() => navigate("/assistant")} className="h-9 rounded-lg border-slate-200 bg-white/80 px-3 text-[11px] font-bold text-slate-700">Ask the assistant</Button></div></div></Panel>
      <Panel className="p-5 sm:p-6"><div className="mb-4 flex items-start justify-between"><div><DataStamp>Recent warnings</DataStamp><h2 className="mt-1 text-[18px] font-bold tracking-[-0.03em]">Requires investigation</h2></div><button onClick={() => navigate("/early-warnings")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={18} /></button></div><div className="space-y-3"><WarningMini
        project="619152"
        title="Cost escalation risk"
        metric="92.6% · current assessment"
        risk="CRITICAL"
        onClick={() => navigate("/projects/619152")}
      />

        <WarningMini
          project="619073"
          title="Schedule delay risk"
          metric="91.6% · current assessment"
          risk="CRITICAL"
          onClick={() => navigate("/projects/619073")}
        />

        <WarningMini
          project="618520"
          title="Progress deviation"
          metric="91.0% · current assessment"
          risk="CRITICAL"
          onClick={() => navigate("/projects/618520")}
        /></div></Panel>
    </section>
  </>;
}

function WarningMini({ project, title, metric, risk, onClick }: { project: string; title: string; metric: string; risk: RiskLevel; onClick: () => void }) {
  return <button onClick={onClick} className="warning-mini"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${riskDot[risk]}`} /><span className="min-w-0 flex-1 text-left"><span className="block text-[12px] font-bold text-[#172033]">{title}</span><span className="mt-1 block font-mono text-[10px] text-slate-500">{project} · {metric}</span></span><ArrowUpRight size={15} className="text-slate-400" /></button>;
}

function ProjectTable({ rows, navigate, compact = false }: { rows: typeof projects; navigate: (path: string) => void; compact?: boolean }) {
  return <div className="overflow-x-auto"><table className="project-table"><thead><tr><th>Project</th><th className="hidden md:table-cell">Sector</th><th className="hidden sm:table-cell">Progress</th><th>Risk</th><th className="hidden lg:table-cell">Primary issue</th><th /></tr></thead><tbody>{rows.map((project) => <tr key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="cursor-pointer"><td><span className="block min-w-[172px] text-[12px] font-bold text-[#172033]">{project.name}</span><span className="mt-1 block font-mono text-[10px] text-slate-500">{project.id} · {project.ministry}</span></td><td className="hidden text-[11px] text-slate-600 md:table-cell">{project.sector}</td><td className="hidden sm:table-cell"><div className="min-w-[74px]"><div className="mb-1 flex justify-between font-mono text-[10px] text-slate-500"><span>{project.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} /></div></div></td><td><RiskBadge level={project.risk} score={project.score} compact={compact} /></td><td className="hidden text-[11px] font-medium text-slate-600 lg:table-cell">{project.issue}</td><td><ArrowUpRight size={15} className="text-slate-400" /></td></tr>)}</tbody></table></div>;
}

function ProjectsPage({ navigate }: { navigate: (path: string) => void }) {
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState<"ALL" | RiskLevel>("ALL");
  const filtered = useMemo(() => projects.filter((project) => (risk === "ALL" || project.risk === risk) && `${project.name} ${project.id} ${project.ministry} ${project.sector}`.toLowerCase().includes(search.toLowerCase())), [search, risk]);
  return <>
    <PageIntro eyebrow="PROJECT EXPLORER · PORTFOLIO REGISTER" title="Projects" subtitle="Search, compare, and investigate the active infrastructure portfolio." action={<Button onClick={() => setRisk("CRITICAL")} className="h-10 rounded-lg bg-[#0b695c] px-4 text-xs font-bold text-white hover:bg-[#095b50]"><AlertTriangle size={15} className="mr-2" /> Critical projects</Button>} />
    <Panel className="p-4 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="top-search flex min-h-11 flex-1"><Search size={16} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search project name, ID, ministry or sector" /></div><div className="flex flex-wrap gap-2">{(["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"] as const).map((level) => <button key={level} onClick={() => setRisk(level)} className={`filter-pill ${risk === level ? "filter-pill-active" : ""}`}>{level === "ALL" ? "All projects" : level}</button>)}</div></div><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"><DataStamp>Active filters</DataStamp><span className="active-filter">Portfolio: National <X size={12} /></span>{risk !== "ALL" && <span className="active-filter">Risk: {risk}<button onClick={() => setRisk("ALL")}><X size={12} /></button></span>}<button onClick={() => { setSearch(""); setRisk("ALL"); }} className="text-[11px] font-bold text-teal-700 hover:underline">Clear all</button></div></Panel>
    <Panel className="ledger-register mt-5 overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><DataStamp>Result set</DataStamp><div className="mt-1 text-[12px] font-bold text-slate-700">{filtered.length} projects shown <span className="font-normal text-slate-500">of {liveDashboard ? Number(liveDashboard.total_projects).toLocaleString("en-IN") : "1,981"} monitored</span></div></div><button className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-teal-700"><MapPinned size={14} /> Geographic view</button></div>{filtered.length ? <ProjectTable rows={filtered} navigate={navigate} /> : <div className="px-6 py-16 text-center"><Search className="mx-auto text-slate-300" size={28} /><h3 className="mt-4 text-sm font-bold">No evidence matches these conditions.</h3><p className="mt-2 text-xs text-slate-500">Adjust the query or clear the selected risk filter to inspect another part of the register.</p></div>}</Panel>
  </>;
}

function ProjectDetails({ navigate }: { navigate: (path: string) => void }) {
  const project = projects[0];
  return <>
    <button onClick={() => navigate("/projects?risk=critical")} className="mb-5 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-teal-700"><ChevronLeft size={15} /> Back to critical project register</button>
    <section className="project-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(23,32,51,0.98) 0%, rgba(23,32,51,0.92) 50%, rgba(23,32,51,0.54) 100%), url(${ASSETS.aerial})` }}><div className="max-w-2xl"><DataStamp>Project dossier · {project.id}</DataStamp><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.055em] text-white sm:text-4xl">{project.name}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-slate-300"><span>{project.sector}</span><span>{project.ministry}</span><span>{project.state}</span></div><div className="mt-7 flex flex-wrap gap-2"><RiskBadge level="CRITICAL" score={91} /><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-white">ONGOING</span></div></div><div className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-0"><div className="project-hero-stat col-span-2 sm:col-span-1"><DataStamp>Overall risk</DataStamp><div className="mt-3 font-mono text-4xl font-semibold tracking-[-0.08em] text-white">91</div><p className="mt-2 text-[11px] text-slate-300">Critical schedule probability</p></div><div className="project-hero-stat"><DataStamp>Expected delay</DataStamp><div className="mt-3 font-mono text-2xl font-semibold tracking-[-0.06em] text-white">7.8m</div><p className="mt-2 text-[11px] text-slate-300">Predicted horizon</p></div><div className="project-hero-stat"><DataStamp>Cost exposure</DataStamp><div className="mt-3 font-mono text-2xl font-semibold tracking-[-0.06em] text-white">₹180Cr</div><p className="mt-2 text-[11px] text-slate-300">Review condition</p></div></div></section>
    <div className="mt-5 grid gap-5 xl:grid-cols-[0.74fr_1.26fr]">
      <div className="space-y-5"><Panel className="risk-ledger p-5"><DataStamp>Risk condition</DataStamp><h2 className="mt-2 text-[20px] font-bold tracking-[-0.04em]">Schedule delay is the primary risk signal.</h2><p className="mt-3 text-[12px] leading-6 text-slate-600">The model has identified a high probability of schedule delay in the next six months, driven by progress gap and delayed milestone conditions.</p><Button onClick={() => navigate("/risk")} variant="outline" className="mt-5 h-9 rounded-lg border-teal-200 bg-teal-50/50 text-[11px] font-bold text-teal-800 hover:bg-teal-50">View risk intelligence <ArrowUpRight className="ml-2" size={13} /></Button></Panel>
        <Panel className="p-5"><DataStamp>Financial overview</DataStamp><dl className="mt-4 space-y-3"><InfoRow label="Original cost" value="₹1,000 Cr" /><InfoRow label="Revised cost" value="₹1,180 Cr" strong /><InfoRow label="Cumulative expenditure" value="₹720 Cr" /><InfoRow label="Cost overrun" value="+18%" alert /></dl></Panel>
        <Panel className="p-5"><DataStamp>Early warning</DataStamp><div className="mt-4 rounded-xl border border-red-100 bg-red-50/60 p-4"><div className="flex items-center gap-2 text-[11px] font-bold text-red-700"><span className="h-2 w-2 rounded-full bg-red-500" /> CRITICAL · NEXT 6 MONTHS</div><h3 className="mt-3 text-sm font-bold">Schedule delay risk at 91%</h3><p className="mt-2 text-[11px] leading-5 text-slate-600">Trigger: progress gap combined with milestone delays.</p></div></Panel>
      </div>
      <div className="space-y-5"><Panel className="p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><DataStamp>Progress analysis</DataStamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Planned progress is 18 points ahead of actual delivery.</h2></div><div className="rounded-lg bg-[#ffd9c2]/60 px-3 py-2 font-mono text-[11px] font-bold text-[#172033]">GAP · −18 PP</div></div><div className="mt-5 h-[245px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={progressTrend} margin={{ top: 8, right: 5, left: -20, bottom: 0 }}><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#667085" }} /><YAxis domain={[0, 80]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Line type="monotone" dataKey="planned" name="Planned" stroke="#0b695c" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="actual" name="Actual" stroke="#d45d55" strokeWidth={2.5} strokeDasharray="5 4" dot={false} /></LineChart></ResponsiveContainer></div><div className="mt-3 flex gap-5 text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-teal-700" /> Planned</span><span className="flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dashed border-red-500" /> Actual</span></div></Panel>
        <Panel className="p-5 sm:p-6"><div className="flex items-end justify-between"><div><DataStamp>Risk breakdown</DataStamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Where the signal is concentrated</h2></div><button onClick={() => navigate("/risk")} className="text-[11px] font-bold text-teal-700 hover:underline">Why this score?</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><RiskBar label="Cost risk" value={72} color="bg-orange-500" /><RiskBar label="Delay risk" value={91} color="bg-red-500" /><RiskBar label="Progress risk" value={84} color="bg-orange-500" /><RiskBar label="Milestone risk" value={79} color="bg-orange-500" /></div></Panel>
        <Panel className="p-5 sm:p-6"><DataStamp>Milestone register</DataStamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Delivery timeline</h2><div className="mt-5 space-y-3"><Milestone label="Land acquisition" date="Complete · Jan 2026" status="COMPLETED" /><Milestone label="Foundation works" date="Complete · Feb 2026" status="COMPLETED" /><Milestone label="Structural works" date="Due 15 May · delayed 44 days" status="DELAYED" /><Milestone label="Final inspection" date="Forecast Q1 2027" status="PENDING" /></div></Panel>
        <Panel className="p-5 sm:p-6"><div className="flex items-end justify-between"><div><DataStamp>Recommended review</DataStamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Investigate contributing conditions</h2></div><CircleHelp size={17} className="text-slate-400" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Recommendation title="Review delayed milestones" reason="3 of 10 milestones delayed" /><Recommendation title="Reconcile progress signals" reason="Physical delivery is 18pp behind plan" /></div><p className="mt-4 text-[10px] leading-5 text-slate-500">Recommendations indicate potential investigation areas and should be interpreted alongside official monitoring inputs.</p></Panel>
      </div>
    </div>
  </>;
}

function InfoRow({ label, value, strong, alert }: { label: string; value: string; strong?: boolean; alert?: boolean }) { return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-[12px] text-slate-500">{label}</dt><dd className={`font-mono text-[12px] font-bold ${alert ? "text-red-600" : strong ? "text-[#172033]" : "text-slate-700"}`}>{value}</dd></div>; }
function RiskBar({ label, value, color }: { label: string; value: number; color: string }) { return <div><div className="mb-2 flex items-center justify-between"><span className="text-[12px] font-semibold text-slate-700">{label}</span><span className="font-mono text-[11px] font-bold text-slate-700">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div></div>; }
function Milestone({ label, date, status }: { label: string; date: string; status: "COMPLETED" | "DELAYED" | "PENDING" }) { const config = status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : status === "DELAYED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"; return <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#fafbfc] p-3"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${config}`}>{status === "COMPLETED" ? <Check size={14} /> : status === "DELAYED" ? <AlertTriangle size={14} /> : <CalendarClock size={14} />}</span><div className="min-w-0 flex-1"><div className="text-[12px] font-bold text-[#172033]">{label}</div><div className="mt-1 text-[10px] text-slate-500">{date}</div></div><span className={`font-mono text-[9px] font-bold tracking-[0.08em] ${status === "DELAYED" ? "text-red-600" : "text-slate-500"}`}>{status}</span></div>; }
function Recommendation({ title, reason }: { title: string; reason: string }) { return <div className="rounded-xl border border-slate-200 bg-[#fafbfc] p-4"><div className="font-mono text-[9px] font-bold tracking-[0.12em] text-orange-600">HIGH PRIORITY</div><div className="mt-2 text-[12px] font-bold text-[#172033]">{title}</div><p className="mt-2 text-[10px] leading-5 text-slate-500">{reason}</p></div>; }

function RiskPage({ navigate }: { navigate: (path: string) => void }) {
  const factors = [{ title: "Physical progress gap", impact: 31, text: "Actual physical progress is 18 percentage points below plan." }, { title: "Milestone delay", impact: 24, text: "Three key milestones are overdue against their approved schedule." }, { title: "Expenditure deviation", impact: 18, text: "Financial drawdown differs from the expected delivery trajectory." }, { title: "Previous schedule revision", impact: 12, text: "A previous completion-date revision increases forecast sensitivity." }];
  return <><PageIntro eyebrow="EXPLAINABLE RISK · PROJECT 619073" title="Risk Intelligence" subtitle="Translate model output into the project conditions that merit review." action={<Button onClick={() => navigate("/projects/619073")} variant="outline" className="h-10 rounded-lg border-slate-200 bg-white text-xs font-bold">Open project dossier <ArrowUpRight className="ml-2" size={14} /></Button>} /><section className="grid gap-5 xl:grid-cols-[0.84fr_1.16fr]"><Panel className="risk-ledger p-6"><DataStamp>Overall project risk</DataStamp><div className="mt-6 flex items-end gap-4"><div className="font-mono text-6xl font-semibold tracking-[-0.1em] text-[#172033]">91</div><RiskBadge level="CRITICAL" /></div><p className="mt-5 max-w-sm text-[13px] leading-6 text-slate-600">Risk has increased from <strong className="text-[#172033]">79%</strong> in the prior reporting period. Schedule delay is the predicted dominant exposure.</p><div className="mt-8 border-t border-slate-200 pt-5"><DataStamp>Interpretation</DataStamp><p className="mt-2 text-[11px] leading-5 text-slate-600">Risk factors indicate model contributors. They should be considered with approved project information and official monitoring inputs.</p></div></Panel><Panel className="p-5 sm:p-6"><DataStamp>Contributing conditions</DataStamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Why is this project at risk?</h2><div className="mt-6 space-y-5">{factors.map((factor, index) => <div key={factor.title} className="group grid gap-2 sm:grid-cols-[38px_1fr_auto]"><span className="font-mono text-[11px] font-bold text-teal-700">0{index + 1}</span><div><div className="flex items-center justify-between gap-3"><h3 className="text-[13px] font-bold text-[#172033]">{factor.title}</h3><span className="sm:hidden font-mono text-[11px] font-bold text-red-600">+{factor.impact}%</span></div><p className="mt-1 text-[11px] leading-5 text-slate-500">{factor.text}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#cf6255]" style={{ width: `${factor.impact * 2.5}%` }} /></div></div><span className="hidden font-mono text-[11px] font-bold text-red-600 sm:block">+{factor.impact}%</span></div>)}</div></Panel></section><section className="mt-5 grid gap-5 xl:grid-cols-2"><Panel className="p-5 sm:p-6"><DataStamp>Risk trend</DataStamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Signal has steepened over six months</h2><div className="mt-4 h-[236px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[{ month: "Jan", risk: 34 }, { month: "Feb", risk: 41 }, { month: "Mar", risk: 57 }, { month: "Apr", risk: 68 }, { month: "May", risk: 79 }, { month: "Jun", risk: 91 }]} margin={{ top: 8, right: 2, left: -20, bottom: 0 }}><defs><linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cf6255" stopOpacity={0.22} /><stop offset="100%" stopColor="#cf6255" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#667085" }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Area dataKey="risk" stroke="#cf6255" strokeWidth={2.5} fill="url(#detailFill)" /></AreaChart></ResponsiveContainer></div></Panel><Panel className="p-5 sm:p-6"><DataStamp>Forecast</DataStamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Expected project timeline</h2><div className="timeline-line mt-7"><TimelinePoint label="Project start" value="Mar 2021" done /><TimelinePoint label="Original completion" value="Dec 2025" done /><TimelinePoint label="Revised completion" value="Jun 2026" current /><TimelinePoint label="Predicted completion" value="Feb 2027" alert /></div></Panel></section></>;
}
function TimelinePoint({ label, value, done, current, alert }: { label: string; value: string; done?: boolean; current?: boolean; alert?: boolean }) { return <div className="timeline-point"><span className={`timeline-dot ${done ? "timeline-done" : current ? "timeline-current" : alert ? "timeline-alert" : ""}`} /><div><div className="text-[12px] font-bold text-[#172033]">{label}</div><div className={`mt-1 font-mono text-[10px] ${alert ? "font-bold text-red-600" : "text-slate-500"}`}>{value}{alert ? " · predicted +8m" : ""}</div></div></div>; }

function WarningsPage({ navigate }: { navigate: (path: string) => void }) {
  const [level, setLevel] = useState("ALL");
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/projects?limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        const realWarnings = data
          .filter(
            (project: any) =>
              project.RiskLevel === "HIGH" ||
              project.RiskLevel === "MEDIUM"
          )
          .sort(
            (a: any, b: any) =>
              b.OverallRiskScore - a.OverallRiskScore
          )
          .slice(0, 20)
          .map((project: any) => ({
            id: String(project.ProjectCode),
            title:
              project.AlertType === "COST_AND_TIME"
                ? "Cost & schedule risk"
                : project.AlertType === "COST_RISK"
                  ? "Cost escalation risk"
                  : project.AlertType === "TIME_RISK"
                    ? "Schedule delay risk"
                    : "Overall project risk",
            metric: `${(
              project.OverallRiskScore
            ).toFixed(1)}%`,
            horizon: "Current assessment",
            risk:
              project.RiskLevel === "HIGH"
                ? "CRITICAL"
                : "MODERATE",
            note:
              project.RecommendedAction ||
              "Project requires monitoring and investigation.",
          }));

        setWarnings(realWarnings);
      })
      .catch((error) => {
        console.error("Failed to load warnings:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return <><PageIntro eyebrow="EARLY WARNING CENTER · ATTENTION REGISTER" title="Early Warnings" subtitle="A prioritised register of predicted project conditions requiring monitoring or investigation." /><div className="mb-5 flex flex-wrap gap-2">{["ALL", "CRITICAL", "HIGH", "MODERATE"].map((item) => <button key={item} onClick={() => setLevel(item)} className={`filter-pill ${item === level ? "filter-pill-active" : ""}`}>{item === "ALL" ? "All warnings" : item}</button>)}</div><section className="grid gap-4 lg:grid-cols-2">{warnings.filter((warning) => level === "ALL" || warning.risk === level).map((warning) => <button key={warning.id} onClick={() => navigate(`/projects/${warning.id}`)} className="warning-card text-left"><div className="flex items-start justify-between gap-3"><div><RiskBadge level={warning.risk} /><div className="mt-4 text-[16px] font-bold tracking-[-0.03em] text-[#172033]">{warning.title}</div><div className="mt-1 font-mono text-[11px] text-slate-500">PROJECT {warning.id}</div></div><ArrowUpRight size={17} className="text-slate-400" /></div><div className="mt-7 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4"><div><DataStamp>Probability</DataStamp><div className="mt-1 font-mono text-[20px] font-bold tracking-[-0.06em] text-[#172033]">{warning.metric}</div></div><div><DataStamp>Horizon</DataStamp><div className="mt-1 text-[12px] font-semibold text-[#172033]">{warning.horizon}</div></div></div><p className="mt-4 text-[11px] text-slate-500">Trigger: {warning.note}</p></button>)}</section></>;
}

function AnalyticsPage({ navigate }: { navigate: (path: string) => void }) {
  return <><PageIntro eyebrow="PORTFOLIO ANALYTICS · COMPARATIVE VIEW" title="Analytics" subtitle="Compare risk concentration, portfolio trends, and sector-level performance." action={<Button onClick={() => navigate("/projects")} variant="outline" className="h-10 rounded-lg border-slate-200 bg-white text-xs font-bold">Explore source projects <ArrowUpRight className="ml-2" size={14} /></Button>} /><section className="grid gap-5 xl:grid-cols-[1fr_1fr]"><Panel className="p-5 sm:p-6"><DataStamp>Sector risk</DataStamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Where average risk is concentrated</h2><div className="mt-5 h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={sectorRisk} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#667085" }} /><YAxis domain={[0, 80]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Bar dataKey="risk" radius={[5, 5, 0, 0]} barSize={35}>{sectorRisk.map((item) => <Cell key={item.sector} fill={item.risk > 60 ? "#cf6255" : item.risk > 50 ? "#d98552" : "#0b695c"} />)}</Bar></BarChart></ResponsiveContainer></div></Panel><Panel className="p-5 sm:p-6"><DataStamp>Risk and warnings</DataStamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Portfolio trend compared</h2><div className="mt-5 h-[310px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={riskTrend} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#667085" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Line dataKey="risk" name="Risk score" stroke="#0b695c" strokeWidth={2.5} dot={{ r: 3, fill: "#0b695c" }} /><Line dataKey="warning" name="Warnings" stroke="#cf6255" strokeWidth={2.5} dot={{ r: 3, fill: "#cf6255" }} /></LineChart></ResponsiveContainer></div></Panel></section><Panel className="mt-5 overflow-hidden"><div className="p-5 sm:px-6"><DataStamp>Ministry comparison</DataStamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Highest-priority portfolios</h2></div><div className="overflow-x-auto"><table className="project-table"><thead><tr><th>Ministry</th><th>Projects</th><th>Average risk</th><th>Critical projects</th><th /></tr></thead><tbody>{[{ ministry: "Road Transport & Highways", projects: 420, risk: 68, critical: 22 }, { ministry: "Coal", projects: 160, risk: 63, critical: 11 }, { ministry: "Power", projects: 310, risk: 54, critical: 10 }, { ministry: "Jal Shakti", projects: 280, risk: 47, critical: 8 }].map((item) => <tr key={item.ministry} onClick={() => navigate("/projects")} className="cursor-pointer"><td className="text-[12px] font-bold text-[#172033]">{item.ministry}</td><td className="font-mono text-[11px] text-slate-600">{item.projects}</td><td className="font-mono text-[11px] font-bold text-slate-700">{item.risk}%</td><td><span className="font-mono text-[11px] font-bold text-red-600">{item.critical}</span></td><td><ArrowUpRight size={15} className="text-slate-400" /></td></tr>)}</tbody></table></div></Panel></>;
}

function AssistantPage({ navigate }: { navigate: (path: string) => void }) {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<
    { who: "ai" | "user"; text: string }[]
  >([
    {
      who: "ai",
      text: "I can help you locate project risk, inspect contributing conditions, and compare portfolio signals. What would you like to examine?",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const send = async (text = input) => {
    if (!text.trim() || loading) return;

    const question = text.trim();

    setMessages((current) => [
      ...current,
      { who: "user", text: question },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/assistant?question=${encodeURIComponent(question)}`
      );

      if (!response.ok) {
        throw new Error("Assistant API request failed");
      }

      const data = await response.json();

      setMessages((current) => [
        ...current,
        {
          who: "ai",
          text: data.answer || "No answer was returned by the assistant.",
        },
      ]);
    } catch (error) {
      console.error("Assistant error:", error);

      setMessages((current) => [
        ...current,
        {
          who: "ai",
          text: "Unable to connect to the PRISM Intelligence API. Please make sure the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const extractProjectIds = (text: string) => {
    const matches = text.match(/\b\d{6}\b/g) || [];
    return [...new Set(matches)];
  };

  const prompts = [
    "Why is project 619152 high risk?",
    "Show me the highest risk projects",
    "Which projects have both cost and time risk?",
    "What is the overall portfolio status?",
  ];

  return (
    <>
      <PageIntro
        eyebrow="PROJECT INTELLIGENCE ASSISTANT · EVIDENCE Q&A"
        title="Query the evidence ledger"
        subtitle="Use natural language to examine risk conditions, project evidence, and comparative signals."
      />

      <section className="assistant-layout">
        <Panel className="assistant-side p-5">
          <DataStamp>Suggested enquiries</DataStamp>

          <h2 className="mt-2 text-[18px] font-bold tracking-[-0.035em]">
            Begin an inspection.
          </h2>

          <div className="mt-5 space-y-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                disabled={loading}
                className="suggested-prompt disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles size={14} />
                {prompt}
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>

          <div className="mt-7 rounded-xl bg-[#ffd9c2]/50 p-4">
            <DataStamp>Assistant scope</DataStamp>

            <p className="mt-2 text-[11px] leading-5 text-slate-600">
              The assistant translates available project intelligence into
              evidence-led answers and links to the relevant project dossier.
              It does not make administrative decisions.
            </p>
          </div>
        </Panel>

        <Panel className="ledger-register flex min-h-[530px] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Bot size={17} />
            </span>

            <div>
              <div className="text-[12px] font-bold">
                PAIMANA Project Intelligence
              </div>

              <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Portfolio context enabled
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => {
              const projectIds =
                message.who === "ai"
                  ? extractProjectIds(message.text)
                  : [];

              return (
                <div
                  key={`${message.who}-${index}`}
                  className={`chat-message ${
                    message.who === "user" ? "chat-user" : "chat-ai"
                  }`}
                >
                  <div>{message.text}</div>

                  {projectIds.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {projectIds.map((projectId) => (
                        <button
                          key={projectId}
                          onClick={() =>
                            navigate(`/projects/${projectId}`)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[10px] font-bold text-teal-700 transition-colors hover:bg-teal-100"
                        >
                          Inspect Project {projectId}
                          <ArrowUpRight size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="chat-message chat-ai">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal-600" />
                  PRISM is analysing the available project intelligence...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="border-t border-slate-100 p-4"
          >
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#fafbfc] p-1.5">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about a project, risk condition, or sector..."
                className="border-0 bg-transparent text-xs shadow-none focus-visible:ring-0"
                disabled={loading}
              />

              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-8 w-8 rounded-lg bg-[#0b695c] p-0 text-white hover:bg-[#095b50]"
                aria-label="Send"
              >
                <Send size={14} />
              </Button>
            </div>
          </form>
        </Panel>
      </section>
    </>
  );
}

function SettingsPage({ role, requestRole }: { role: Role; requestRole: (role: Role) => void }) { return <><PageIntro eyebrow="WORKSPACE PREFERENCES" title="Settings" subtitle="Prototype controls for demonstration scope and interface preferences." /><Panel className="max-w-3xl p-5 sm:p-6"><DataStamp>Demo workspace role</DataStamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Change interface context</h2><p className="mt-2 max-w-xl text-[12px] leading-6 text-slate-500">Role selection requires verification before an authorised workspace is loaded. In production, these permissions must be enforced by the backend.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{(Object.keys(roleMeta) as Role[]).map((key) => <button key={key} onClick={() => key !== role && requestRole(key)} className={`settings-role ${role === key ? "settings-role-active" : ""}`}><span className="text-left text-[12px] font-bold">{roleMeta[key].title}</span>{role === key && <Check size={15} className="text-teal-700" />}</button>)}</div></Panel><TextSizeSettings /><Panel className="mt-5 max-w-3xl p-5 sm:p-6"><DataStamp>Interface principles</DataStamp><div className="mt-4 grid gap-3 sm:grid-cols-3"><SettingsNote icon={Activity} title="Evidence first" text="Metrics retain context, timeframe, and visible status." /><SettingsNote icon={ShieldAlert} title="Local risk color" text="Critical color appears only where conditions require attention." /><SettingsNote icon={CircleUserRound} title="Role-aware view" text="Content density responds to the demonstrated role." /></div></Panel></>; }
function SettingsNote({ icon: Icon, title, text }: { icon: typeof Activity; title: string; text: string }) { return <div className="rounded-xl bg-[#fafbfc] p-4"><Icon size={17} className="text-teal-700" /><div className="mt-4 text-[12px] font-bold">{title}</div><p className="mt-2 text-[10px] leading-5 text-slate-500">{text}</p></div>; }
function TextSizeSettings() { const [size, setSize] = useState<TextSize>(() => localStorage.getItem("paimana-text-size") === "COMFORTABLE" ? "COMFORTABLE" : "STANDARD"); useEffect(() => { document.documentElement.dataset.textSize = size.toLowerCase(); localStorage.setItem("paimana-text-size", size); }, [size]); return <Panel className="mt-5 max-w-3xl p-5 sm:p-6"><DataStamp>Reading accessibility</DataStamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Detailed report text size</h2><p className="mt-2 max-w-xl text-[12px] leading-6 text-slate-500">Choose a more comfortable text size for project dossier descriptions, evidence, and supporting notes. Your preference is saved on this device.</p><div className="text-size-choice mt-5" role="group" aria-label="Detailed report text size"><button type="button" onClick={() => setSize("STANDARD")} data-active={size === "STANDARD"} aria-pressed={size === "STANDARD"}>Standard</button><button type="button" onClick={() => setSize("COMFORTABLE")} data-active={size === "COMFORTABLE"} aria-pressed={size === "COMFORTABLE"}>Comfortable</button></div></Panel>; }
function RoleSwitchDialog({ currentRole, requestedRole, onCancel, onAuthorized }: { currentRole: Role; requestedRole: Role | null; onCancel: () => void; onAuthorized: (role: Role) => void }) { const [step, setStep] = useState<"confirm" | "verify">("confirm"); const [code, setCode] = useState(""); const [error, setError] = useState(""); useEffect(() => { setStep("confirm"); setCode(""); setError(""); }, [requestedRole]); const permitted = requestedRole ? roleSwitchPermissions[currentRole].includes(requestedRole) : false; const verify = () => { if (!requestedRole) return; if (!permitted) { setError("Access restricted. Your current workspace has not been changed."); return; } if (code.trim().toUpperCase() !== "VERIFY") { setError("Verification failed. Your current workspace has not been changed."); return; } onAuthorized(requestedRole); }; return <Dialog open={Boolean(requestedRole)} onOpenChange={(open) => !open && onCancel()}><DialogContent><DialogHeader><DataStamp>{step === "confirm" ? "Switch workspace role" : "Verify workspace access"}</DataStamp><DialogTitle>{step === "confirm" ? "Confirm requested workspace" : "Verification required"}</DialogTitle><DialogDescription>{step === "confirm" ? "Switching workspaces requires verification before the authorized interface can be loaded." : "This prototype uses a frontend demonstration check only. Production authorization must be enforced by the backend."}</DialogDescription></DialogHeader>{requestedRole && <div className="space-y-3 rounded-lg border border-slate-200 bg-[#fafbfc] p-4 text-[12px]"><div><span className="block text-[10px] text-slate-500">Current workspace</span><strong>{roleMeta[currentRole].title}</strong></div><div><span className="block text-[10px] text-slate-500">Requested workspace</span><strong>{roleMeta[requestedRole].title}</strong></div></div>}{step === "verify" && <div className="space-y-2"><label className="text-[11px] font-semibold">Verification code<Input autoFocus value={code} onChange={(event) => { setCode(event.target.value); setError(""); }} placeholder="Enter VERIFY for demo access" /></label>{error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}{!permitted && <p className="text-[11px] text-red-600">This role is outside the current workspace authorization scope.</p>}</div>}<DialogFooter><Button variant="outline" onClick={onCancel}>Cancel</Button>{step === "confirm" ? <Button onClick={() => setStep("verify")}>Continue</Button> : <Button onClick={verify}>Verify</Button>}</DialogFooter></DialogContent></Dialog>; }
function RestrictedAccess({ onReturn }: { onReturn: () => void }) { return <Panel className="max-w-xl p-6"><DataStamp>Access restricted</DataStamp><h1 className="mt-2 text-[22px] font-bold">You do not have permission to access this workspace.</h1><p className="mt-3 text-[12px] leading-6 text-slate-500">Your currently authorised role does not include this view. No workspace data has been loaded.</p><Button onClick={onReturn} className="mt-5">Return to command center</Button></Panel>; }

export default function Home() {
  const [location, navigate] = useLocation();
  const [role, setRole] = useState<Role>("MONITORING_OFFICER");
  const [requestedRole, setRequestedRole] = useState<Role | null>(null);
  const [language, setLanguage] = useState<Language>(() => new URLSearchParams(window.location.search).get("lang") === "hi" ? "HI" : (localStorage.getItem("paimana-language") as Language) || "EN");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [, setDataVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const loadLiveData = async () => {
      try {
        const [dashboardRes, projectsRes, analyticsRes] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard`),
          fetch(`${API_BASE}/api/projects?limit=1000`),
          fetch(`${API_BASE}/api/analytics`),
        ]);
        if (
          !dashboardRes.ok ||
          !projectsRes.ok ||
          !analyticsRes.ok
        ) {
          throw new Error("API request failed");
        }
        const dashboard = await dashboardRes.json();
        const records = await projectsRes.json();
        const analytics = await analyticsRes.json();

        riskTrend = analytics.risk_trend.map((item: any) => ({
          month: item.ReportMonth,
          risk: Number(item.risk ?? 0),
          warning: Number(item.warnings ?? 0),
        }));

        sectorRisk = analytics.agency_risk.map((item: any) => ({
          sector: item.Agency,
          risk: Number(item.average_risk ?? 0),
        }));
        if (cancelled) return;
        liveDashboard = dashboard;
        projects = records.map((p: any) => ({
          id: String(p.ProjectCode),
          name: p.ProjectName || `Project ${p.ProjectCode}`,
          ministry: p.Agency || "—",
          sector: "Infrastructure",
          state: p.State || "—",
          progress: Number(p["Physical Progress"] ?? 0),
          cost: `₹${Number(p.OriginalCost ?? 0).toLocaleString("en-IN")} Cr`,
          score: Math.round(Number(p.OverallRiskScore ?? 0)),
          risk: (p.RiskLevel === "MEDIUM" ? "MODERATE" : p.RiskLevel || "LOW") as RiskLevel,
          issue: p.AlertType === "COST_AND_TIME" ? "Cost & time exposure" : p.AlertType === "COST_RISK" ? "Cost exposure" : p.AlertType === "TIME_RISK" ? "Schedule exposure" : "Monitoring"
        }));
        riskDistribution = [
          { name: "Low", value: Number(dashboard.risk_distribution?.LOW ?? 0), color: "#1F9D72" },
          { name: "Moderate", value: Number(dashboard.risk_distribution?.MEDIUM ?? 0), color: "#D7A93C" },
          { name: "High", value: Number(dashboard.risk_distribution?.HIGH ?? 0), color: "#D97722" },
          { name: "Critical", value: 0, color: "#CE4A42" },
        ];
        setDataVersion(v => v + 1);
      } catch (error) {
        console.warn("PRISM API unavailable; using bundled demo data.", error);
      }
    };
    loadLiveData();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { document.documentElement.lang = language === "HI" ? "hi" : "en"; document.documentElement.dataset.textSize = localStorage.getItem("paimana-text-size") === "COMFORTABLE" ? "comfortable" : "standard"; }, [language]);
  const changeLanguage = (nextLanguage: Language) => { if (nextLanguage === language) return; document.body.classList.add("language-transitioning"); window.setTimeout(() => setLanguage(nextLanguage), 100); window.setTimeout(() => document.body.classList.remove("language-transitioning"), 290); };
  const requestRole = (nextRole: Role) => { if (nextRole !== role) setRequestedRole(nextRole); };
  const authorizeRole = (nextRole: Role) => { setRole(nextRole); setRequestedRole(null); navigate("/dashboard"); };
  if (!isSignedIn || location === "/") return <><LocalizationLayer language={language} /><LoginScreen language={language} setLanguage={changeLanguage} onEnter={(nextRole) => { setRole(nextRole); setIsSignedIn(true); navigate("/dashboard"); }} /></>;
  const currentRoute = location.startsWith("/projects") ? "/projects" : ["/risk", "/early-warnings", "/analytics", "/assistant", "/settings"].includes(location) ? location : "/dashboard";
  const page = !rolePermissions[role].includes(currentRoute) ? <RestrictedAccess onReturn={() => navigate("/dashboard")} /> : location.startsWith("/projects/") ? <ProjectDossier language={language} navigate={navigate} /> : location.startsWith("/projects") ? <ProjectsPage navigate={navigate} /> : location === "/risk" ? <RiskPage navigate={navigate} /> : location === "/early-warnings" ? <WarningsPage navigate={navigate} /> : location === "/analytics" ? <AnalyticsPage navigate={navigate} /> : location === "/assistant" ? <AssistantPage navigate={navigate} /> : location === "/settings" ? <SettingsPage role={role} requestRole={requestRole} /> : <Dashboard role={role} navigate={navigate} />;
  return <><LocalizationLayer language={language} /><AppShell role={role} requestRole={requestRole} language={language} setLanguage={changeLanguage} onSignOut={() => { setRequestedRole(null); setIsSignedIn(false); navigate("/"); }}>{page}</AppShell><RoleSwitchDialog currentRole={role} requestedRole={requestedRole} onCancel={() => setRequestedRole(null)} onAuthorized={authorizeRole} /></>;
}
