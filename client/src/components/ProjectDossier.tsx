/**
 * Civic Ledger design reminder: the dossier is a single evidence narrative for one project.
 * Use ledger rules, explicit source stamps, and risk colors only for decision-relevant findings.
 */
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  Check,
  ChevronLeft,
  CircleDollarSign,
  CircleHelp,
  ClipboardCheck,
  Download,
  FileSearch,
  Landmark,
  MapPin,
  ReceiptText,
  Search,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useEffect, useMemo, useState } from "react";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
type DossierTab = "Overview" | "Cost" | "Schedule" | "Risk Factors" | "Evidence" | "History";

const ASSETS = { aerial: "/manus-storage/paimana-project-aerial_9090a182.png" };
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const projectCatalog = [
  { id: "619073", name: "Eastern Freight Corridor", ministry: "Railways", sector: "Transport & Logistics", state: "Uttar Pradesh", progress: 52, financialProgress: 61, budget: "₹1,000 Cr", revised: "₹1,180 Cr", spent: "₹720 Cr", forecast: "₹1,260 Cr", score: 91, risk: "CRITICAL" as RiskLevel, primaryIssue: "Schedule delay", delay: "7.8 months", expectedCompletion: "Feb 2027" },
  { id: "619152", name: "National Highway Expansion", ministry: "Road Transport & Highways", sector: "Transport & Logistics", state: "Maharashtra", progress: 64, financialProgress: 69, budget: "₹2,250 Cr", revised: "₹2,460 Cr", spent: "₹1,697 Cr", forecast: "₹2,590 Cr", score: 88, risk: "CRITICAL" as RiskLevel, primaryIssue: "Cost exposure", delay: "5.4 months", expectedCompletion: "Nov 2026" },
  { id: "618520", name: "River Basin Water Grid", ministry: "Jal Shakti", sector: "Water & Sanitation", state: "Rajasthan", progress: 48, financialProgress: 56, budget: "₹820 Cr", revised: "₹920 Cr", spent: "₹516 Cr", forecast: "₹984 Cr", score: 84, risk: "CRITICAL" as RiskLevel, primaryIssue: "Progress gap", delay: "6.1 months", expectedCompletion: "Jan 2027" },
  { id: "619168", name: "Coastal Transmission Link", ministry: "Power", sector: "Energy", state: "Tamil Nadu", progress: 68, financialProgress: 73, budget: "₹700 Cr", revised: "₹780 Cr", spent: "₹569 Cr", forecast: "₹818 Cr", score: 72, risk: "HIGH" as RiskLevel, primaryIssue: "Milestone slip", delay: "3.2 months", expectedCompletion: "Sep 2026" },
  { id: "619142", name: "Rural Digital Backbone", ministry: "Communications", sector: "Communication", state: "Assam", progress: 76, financialProgress: 74, budget: "₹350 Cr", revised: "₹390 Cr", spent: "₹289 Cr", forecast: "₹401 Cr", score: 54, risk: "HIGH" as RiskLevel, primaryIssue: "Implementation", delay: "1.8 months", expectedCompletion: "Aug 2026" },
  { id: "619184", name: "Integrated Steel Terminal", ministry: "Steel", sector: "Industry", state: "Odisha", progress: 83, financialProgress: 79, budget: "₹980 Cr", revised: "₹1,050 Cr", spent: "₹830 Cr", forecast: "₹1,074 Cr", score: 39, risk: "MODERATE" as RiskLevel, primaryIssue: "Cost variance", delay: "0.6 months", expectedCompletion: "Jul 2026" },
];

const riskStyles: Record<RiskLevel, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MODERATE: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
};

function Stamp({ children }: { children: React.ReactNode }) { return <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{children}</span>; }
function Plate({ className = "", children }: { className?: string; children: React.ReactNode }) { return <section className={`ledger-panel ${className}`}>{children}</section>; }
function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) { const dot = level === "CRITICAL" ? "bg-red-500" : level === "HIGH" ? "bg-orange-500" : level === "MODERATE" ? "bg-amber-500" : "bg-emerald-500"; return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] ${riskStyles[level]}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{level}{score !== undefined ? ` · ${score}` : ""}</span>; }

function DossierKpi({ icon: Icon, label, value, detail, accent }: { icon: typeof Landmark; label: string; value: string; detail: string; accent?: "risk" | "teal" }) {
  return <div className={`dossier-kpi ${accent === "risk" ? "dossier-kpi-risk" : ""}`}><div className="flex items-start justify-between"><Stamp>{label}</Stamp><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent === "risk" ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-700"}`}><Icon size={16} /></span></div><div className="mt-6 font-mono text-[24px] font-semibold tracking-[-0.07em] text-[#172033]">{value}</div><p className="mt-1 text-[10px] leading-5 text-slate-500">{detail}</p></div>;
}

function RiskStrip({ label, value, color, explanation }: { label: string; value: number; color: string; explanation?: string }) { return <div><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">{label}{explanation && <span title={explanation} className="inline-flex cursor-help text-slate-400"><CircleHelp size={13} /></span>}</span><span className="font-mono text-[11px] font-bold text-slate-700">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div></div>; }

function TabBar({ active, setActive, language }: { active: DossierTab; setActive: (tab: DossierTab) => void; language: "EN" | "HI" }) { const tabs: DossierTab[] = ["Overview", "Cost", "Schedule", "Risk Factors", "Evidence", "History"]; const labels = language === "HI" ? { Overview: "अवलोकन", Cost: "लागत", Schedule: "समय-सारणी", "Risk Factors": "जोखिम कारक", Evidence: "साक्ष्य", History: "इतिहास" } : { Overview: "Overview", Cost: "Cost", Schedule: "Schedule", "Risk Factors": "Risk Factors", Evidence: "Evidence", History: "History" }; return <div className="dossier-tabs">{tabs.map((tab) => <button key={tab} onClick={() => setActive(tab)} className={`dossier-tab ${active === tab ? "dossier-tab-active" : ""}`}>{labels[tab]}</button>)}</div>; }

function OverviewTab({ project, setActive }: { project: typeof projectCatalog[number]; setActive: (tab: DossierTab) => void }) {
  const riskValues = [{ label: "Cost overrun risk", value: project.risk === "MODERATE" ? 39 : project.risk === "HIGH" ? 67 : 72, color: "bg-orange-500", explanation: "The project’s forecast cost is higher than its revised budget, indicating that committed or expected costs may continue to rise." }, { label: "Time overrun risk", value: project.score, color: project.risk === "CRITICAL" ? "bg-red-500" : "bg-orange-500", explanation: "Physical delivery and milestone timing suggest the project may finish later than the currently approved completion date." }, { label: "Progress deviation", value: Math.max(project.score - 7, 28), color: "bg-orange-500", explanation: "Actual project delivery is below the planned trajectory. A larger gap increases the chance of schedule pressure." }];
  return <div className="mt-5 grid gap-5 xl:grid-cols-[0.75fr_1.25fr]"><div className="space-y-5"><Plate className="risk-ledger p-5"><Stamp>AI risk summary</Stamp><h2 className="mt-2 text-[20px] font-bold tracking-[-0.04em]">{project.primaryIssue} is the dominant condition.</h2><p className="mt-3 text-[12px] leading-6 text-slate-600">The current monitoring snapshot identifies a material likelihood of adverse delivery conditions within the next reporting horizon. Review the contributing signals before escalation.</p><div className="mt-5 rounded-xl border border-red-100 bg-red-50/65 p-3.5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700"><AlertTriangle size={14} /> Early warning · active</div><p className="mt-2 text-[11px] leading-5 text-slate-600">Risk score has increased by 12 points since the January reporting period.</p></div><Button onClick={() => setActive("Risk Factors")} variant="outline" className="mt-5 h-9 rounded-lg border-teal-200 bg-teal-50/50 text-[11px] font-bold text-teal-800 hover:bg-teal-50">Inspect contributing factors <ArrowUpRight className="ml-2" size={13} /></Button></Plate><Plate className="p-5"><Stamp>Recommended review</Stamp><div className="mt-4 space-y-3"><ReviewNote title="Reconcile planned and physical progress" reason={`${project.progress}% actual progress warrants schedule validation.`} /><ReviewNote title="Inspect delayed milestone conditions" reason="Check dependencies, approvals, and contractor mobilisation." /><ReviewNote title="Validate forecast completion date" reason={`Current model horizon indicates ${project.delay} delivery exposure.`} /></div><p className="mt-4 text-[10px] leading-5 text-slate-500">These are potential investigation areas, not administrative decisions.</p></Plate></div><div className="space-y-5"><Plate className="p-5 sm:p-6"><div className="flex items-end justify-between"><div><Stamp>AI risk summary</Stamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Risk condition breakdown</h2></div><RiskBadge level={project.risk} score={project.score} /></div><div className="mt-6 grid gap-4 sm:grid-cols-3">{riskValues.map((item) => <RiskStrip key={item.label} {...item} />)}</div><div className="mt-6 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500"><strong className="font-bold text-[#172033]">Model interpretation: </strong>the risk profile is driven by delivery progress, milestone status, and cost trajectory rather than one signal in isolation.</div></Plate><Plate className="p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Stamp>Schedule condition</Stamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Planned progress remains ahead of delivery.</h2></div><button onClick={() => setActive("Schedule")} className="text-left text-[11px] font-bold text-teal-700 hover:underline">Inspect schedule <ArrowUpRight className="inline" size={13} /></button></div><div className="mt-5 h-[240px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={progressSeries(project)} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#667085" }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Line type="monotone" dataKey="planned" name="Planned" stroke="#0b695c" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="actual" name="Actual" stroke="#d45d55" strokeWidth={2.5} strokeDasharray="5 4" dot={false} /></LineChart></ResponsiveContainer></div><div className="mt-2 flex gap-5 text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-teal-700" /> Planned</span><span className="flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dashed border-red-500" /> Actual</span></div></Plate></div></div>;
}

function CostTab({ project }: { project: typeof projectCatalog[number] }) { const cost = [{ label: "Approved budget", value: parseAmount(project.budget), color: "#0b695c" }, { label: "Revised budget", value: parseAmount(project.revised), color: "#d98654" }, { label: "Cumulative expenditure", value: parseAmount(project.spent), color: "#8097a6" }, { label: "Forecast outturn", value: parseAmount(project.forecast), color: "#ce4a42" }]; return <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><Plate className="p-5 sm:p-6"><div className="flex items-end justify-between"><div><Stamp>Cost analysis · ₹ crore</Stamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Budget, expenditure, and forecast</h2></div><span className="rounded-lg bg-red-50 px-3 py-2 font-mono text-[10px] font-bold text-red-600">FORECAST +{Math.max(3, Math.round((parseAmount(project.forecast) / parseAmount(project.revised) - 1) * 100))}%</span></div><div className="mt-6 h-[315px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={cost} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#667085" }} interval={0} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} formatter={(value) => [`₹${value} Cr`, "Value"]} /><Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={46}>{cost.map((entry) => <Cell key={entry.label} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div></Plate><Plate className="ledger-register p-5"><Stamp>Cost ledger</Stamp><dl className="mt-5 space-y-4"><LedgerRow label="Approved budget" value={project.budget} icon={Landmark} /><LedgerRow label="Revised estimate" value={project.revised} icon={ReceiptText} /><LedgerRow label="Cumulative expenditure" value={project.spent} icon={WalletCards} /><LedgerRow label="Forecast outturn" value={project.forecast} icon={TrendingUp} alert /><LedgerRow label="Cost overrun signal" value={project.risk === "MODERATE" ? "+7%" : "+18%"} icon={CircleDollarSign} alert /></dl><div className="mt-5 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500">The forecast should be reconciled against current contractual commitments and approved variation orders.</div></Plate></div>; }

function ScheduleTab({ project }: { project: typeof projectCatalog[number] }) { return <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Plate className="p-5 sm:p-6"><div className="flex items-end justify-between"><div><Stamp>Schedule analysis</Stamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Delivery is below the approved trajectory.</h2></div><span className="rounded-lg bg-[#ffd9c2]/60 px-3 py-2 font-mono text-[10px] font-bold text-[#172033]">GAP · −18 PP</span></div><div className="mt-6 h-[275px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={progressSeries(project)} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#667085" }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Line type="monotone" dataKey="planned" name="Planned" stroke="#0b695c" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="actual" name="Actual" stroke="#d45d55" strokeWidth={2.5} strokeDasharray="5 4" dot={false} /></LineChart></ResponsiveContainer></div></Plate><Plate className="p-5 sm:p-6"><Stamp>Completion forecast</Stamp><div className="mt-5 space-y-5"><TimelineEntry label="Project start" value="Mar 2021" state="done" /><TimelineEntry label="Original completion" value="Dec 2025" state="done" /><TimelineEntry label="Revised completion" value="Jun 2026" state="current" /><TimelineEntry label="Expected completion" value={`${project.expectedCompletion} · +${project.delay}`} state="alert" /></div></Plate><Plate className="ledger-register p-5 sm:p-6 xl:col-span-2"><div className="flex items-end justify-between"><div><Stamp>Milestone register</Stamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">Delivery evidence</h2></div><ClipboardCheck size={18} className="text-teal-700" /></div><div className="mt-5 overflow-x-auto"><table className="project-table"><thead><tr><th>Milestone</th><th>Planned</th><th>Observed</th><th>Status</th></tr></thead><tbody><MilestoneRow name="Land acquisition" planned="Jan 2026" observed="Jan 2026" status="Complete" /><MilestoneRow name="Foundation works" planned="Feb 2026" observed="Feb 2026" status="Complete" /><MilestoneRow name="Structural works" planned="15 May 2026" observed="Delayed · 44 days" status="Delayed" /><MilestoneRow name="Final inspection" planned="Dec 2026" observed={project.expectedCompletion} status="Forecast" /></tbody></table></div></Plate></div>; }

function RiskFactorsTab({ project }: { project: typeof projectCatalog[number] }) { const factors = [{ title: "Physical progress gap", impact: 31, note: `Actual progress is ${Math.max(8, 70 - project.progress)} percentage points below plan.` }, { title: "Milestone delay", impact: 24, note: "Three key milestones require schedule reconciliation." }, { title: "Expenditure deviation", impact: 18, note: "Financial drawdown differs from the expected delivery trajectory." }, { title: "Previous schedule revision", impact: 12, note: "A revised completion date increases forecast sensitivity." }]; return <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Plate className="ledger-register p-5 sm:p-6"><Stamp>Explainable AI · SHAP contributors</Stamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Why is this project at risk?</h2><p className="mt-2 max-w-2xl text-[12px] leading-6 text-slate-500">These factors explain how observed project conditions contribute to the model’s risk estimate. They do not establish causality or replace official review.</p><div className="mt-7 space-y-6">{factors.map((factor, index) => <div key={factor.title} className="grid gap-2 sm:grid-cols-[40px_1fr_auto]"><span className="font-mono text-[11px] font-bold text-teal-700">0{index + 1}</span><div><div className="flex items-center justify-between gap-3"><h3 className="text-[13px] font-bold text-[#172033]">{factor.title}</h3><span className="font-mono text-[11px] font-bold text-red-600 sm:hidden">+{factor.impact}%</span></div><p className="mt-1 text-[11px] leading-5 text-slate-500">{factor.note}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#cf6255]" style={{ width: `${factor.impact * 2.65}%` }} /></div></div><span className="hidden font-mono text-[11px] font-bold text-red-600 sm:block">+{factor.impact}%</span></div>)}</div></Plate><RiskHistoryPanel project={project} /></div>; }

function EvidenceTab({ project }: { project: typeof projectCatalog[number] }) { const rows = [{ source: "Common Upload Form", item: "Physical progress", signal: `${project.progress}% against 70% planned`, status: "Needs review" }, { source: "Milestone register", item: "Structural works", signal: "44 days beyond target date", status: "Delayed" }, { source: "Financial return", item: "Expenditure trajectory", signal: `${project.spent} recorded against revised estimate`, status: "Observed" }, { source: "Risk engine", item: "Schedule prediction", signal: `${project.score}% risk · ${project.delay} horizon`, status: "Critical" }]; return <div className="mt-5 grid gap-5 xl:grid-cols-[1.32fr_0.68fr]"><Plate className="ledger-register overflow-hidden"><div className="border-b border-slate-100 p-5 sm:px-6"><Stamp>Evidence ledger</Stamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Conditions supporting the current risk view</h2><p className="mt-2 text-[12px] leading-6 text-slate-500">Evidence sources show the monitored inputs used to inform this project dossier.</p></div><div className="overflow-x-auto"><table className="project-table"><thead><tr><th>Source</th><th>Evidence item</th><th>Latest signal</th><th>Condition</th></tr></thead><tbody>{rows.map((row) => <tr key={row.item}><td className="font-mono text-[10px] font-semibold text-slate-600">{row.source}</td><td className="text-[12px] font-bold text-[#172033]">{row.item}</td><td className="text-[11px] text-slate-500">{row.signal}</td><td><EvidenceStatus text={row.status} /></td></tr>)}</tbody></table></div></Plate><div className="space-y-5"><Plate className="risk-ledger p-5"><Stamp>Early warning</Stamp><h3 className="mt-2 text-[17px] font-bold tracking-[-0.03em]">Schedule condition has strengthened.</h3><p className="mt-3 text-[11px] leading-5 text-slate-600">The combined progress gap and delayed structural work now place the project within the current critical warning threshold.</p><div className="mt-4 flex items-center gap-2 font-mono text-[10px] font-bold text-red-600"><TrendingUp size={14} /> RISK +12 PP SINCE JAN</div></Plate><Plate className="p-5"><Stamp>Evidence note</Stamp><p className="mt-3 text-[11px] leading-5 text-slate-600">Evidence should be read alongside approved project reports, field updates, and official monitoring inputs.</p><Button variant="outline" className="mt-4 h-9 rounded-lg border-slate-200 bg-white text-[11px] font-bold">Export dossier summary <ArrowUpRight className="ml-2" size={13} /></Button></Plate></div></div>; }

function HistoryTab({ project }: { project: typeof projectCatalog[number] }) { const history = riskSeries(project); return <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]"><RiskHistoryPanel project={project} large /><Plate className="ledger-register overflow-hidden"><div className="border-b border-slate-100 p-5 sm:px-6"><Stamp>Reporting history</Stamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Risk score across reporting periods</h2></div><div className="overflow-x-auto"><table className="project-table"><thead><tr><th>Period</th><th>Risk score</th><th>Movement</th><th>Dominant condition</th></tr></thead><tbody>{history.map((entry, index) => <tr key={entry.month}><td className="font-mono text-[11px] font-semibold text-slate-600">{entry.month} 2026</td><td className="font-mono text-[12px] font-bold text-[#172033]">{entry.risk}</td><td><span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold ${index === 0 ? "text-slate-400" : "text-red-600"}`}>{index === 0 ? "—" : <><TrendingUp size={12} /> +{entry.risk - history[index - 1].risk}</>}</span></td><td className="text-[11px] text-slate-500">{index < 2 ? "Progress variance" : index < 4 ? "Milestone slippage" : project.primaryIssue}</td></tr>)}</tbody></table></div></Plate></div>; }

function RiskHistoryPanel({ project, large = false }: { project: typeof projectCatalog[number]; large?: boolean }) { return <Plate className="p-5 sm:p-6"><div className="flex items-end justify-between"><div><Stamp>Risk trend</Stamp><h2 className="mt-1 text-[19px] font-bold tracking-[-0.04em]">{large ? "Risk has steepened across six reporting periods" : "Previous reporting periods"}</h2></div><span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"><TrendingUp size={12} /> +12 pp</span></div><div className={`${large ? "h-[325px]" : "h-[260px]"} mt-5`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={riskSeries(project)} margin={{ top: 8, right: 2, left: -20, bottom: 0 }}><defs><linearGradient id={`riskFill-${project.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cf6255" stopOpacity={0.22} /><stop offset="100%" stopColor="#cf6255" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#667085" }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4e7ec", fontSize: 12 }} /><Area dataKey="risk" stroke="#cf6255" strokeWidth={2.5} fill={`url(#riskFill-${project.id})`} /></AreaChart></ResponsiveContainer></div></Plate>; }

function ReviewNote({ title, reason }: { title: string; reason: string }) { return <div className="rounded-xl border border-slate-100 bg-[#fafbfc] p-3.5"><div className="font-mono text-[9px] font-bold tracking-[0.12em] text-orange-600">HIGH PRIORITY</div><h3 className="mt-2 text-[12px] font-bold text-[#172033]">{title}</h3><p className="mt-1.5 text-[10px] leading-5 text-slate-500">{reason}</p></div>; }
function LedgerRow({ label, value, icon: Icon, alert }: { label: string; value: string; icon: typeof Landmark; alert?: boolean }) { return <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5 last:border-0 last:pb-0"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${alert ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}><Icon size={15} /></span><div className="min-w-0 flex-1"><dt className="text-[11px] text-slate-500">{label}</dt><dd className={`mt-1 font-mono text-[12px] font-bold ${alert ? "text-red-600" : "text-[#172033]"}`}>{value}</dd></div></div>; }
function TimelineEntry({ label, value, state }: { label: string; value: string; state: "done" | "current" | "alert" }) { const visual = state === "done" ? "bg-emerald-500" : state === "current" ? "bg-teal-700" : "bg-red-500"; return <div className="timeline-point"><span className={`timeline-dot ${visual}`} /><div><div className="text-[12px] font-bold text-[#172033]">{label}</div><div className={`mt-1 font-mono text-[10px] ${state === "alert" ? "font-bold text-red-600" : "text-slate-500"}`}>{value}</div></div></div>; }
function MilestoneRow({ name, planned, observed, status }: { name: string; planned: string; observed: string; status: "Complete" | "Delayed" | "Forecast" }) { return <tr><td className="text-[12px] font-bold text-[#172033]">{name}</td><td className="font-mono text-[10px] text-slate-500">{planned}</td><td className="font-mono text-[10px] text-slate-600">{observed}</td><td><EvidenceStatus text={status} /></td></tr>; }
function EvidenceStatus({ text }: { text: string }) { const critical = text === "Critical" || text === "Delayed" || text === "Needs review"; return <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] ${critical ? "text-red-600" : text === "Complete" ? "text-emerald-700" : "text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${critical ? "bg-red-500" : text === "Complete" ? "bg-emerald-500" : "bg-slate-400"}`} />{text}</span>; }
function EvidenceTabEnhanced({ project }: { project: typeof projectCatalog[number] }) { const [query, setQuery] = useState(""); const [status, setStatus] = useState("All"); const rows = [{ source: "Common Upload Form", item: "Physical progress", signal: `${project.progress}% against 70% planned`, status: "Needs review" }, { source: "Milestone register", item: "Structural works", signal: "44 days beyond target date", status: "Delayed" }, { source: "Financial return", item: "Expenditure trajectory", signal: `${project.spent} recorded against revised estimate`, status: "Observed" }, { source: "Risk engine", item: "Schedule prediction", signal: `${project.score}% risk · ${project.delay} horizon`, status: "Critical" }]; const matching = rows.filter((row) => (status === "All" || row.status === status) && `${row.source} ${row.item} ${row.signal}`.toLowerCase().includes(query.toLowerCase())); return <div className="mt-5 grid gap-5 xl:grid-cols-[1.32fr_0.68fr]"><Plate className="ledger-register overflow-hidden"><div className="border-b border-slate-100 p-5 sm:px-6"><Stamp>Evidence ledger</Stamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Conditions supporting the current risk view</h2><p className="mt-2 text-[12px] leading-6 text-slate-500">Search updates, source records, and document conditions within this project dossier.</p><div className="evidence-toolbar mt-5"><div className="evidence-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence or source record" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter evidence condition"><option>All</option><option>Needs review</option><option>Delayed</option><option>Observed</option><option>Critical</option></select></div></div><div className="overflow-x-auto"><table className="project-table"><thead><tr><th>Source</th><th>Evidence item</th><th>Latest signal</th><th>Condition</th></tr></thead><tbody>{matching.map((row) => <tr key={row.item}><td className="font-mono text-[10px] font-semibold text-slate-600">{row.source}</td><td className="text-[12px] font-bold text-[#172033]">{row.item}</td><td className="text-[11px] text-slate-500">{row.signal}</td><td><EvidenceStatus text={row.status} /></td></tr>)}</tbody></table>{matching.length === 0 && <div className="px-6 py-12 text-center"><Search className="mx-auto text-slate-300" size={24} /><p className="mt-3 text-[12px] font-bold text-slate-700">No evidence records match this query.</p><button onClick={() => { setQuery(""); setStatus("All"); }} className="mt-2 text-[11px] font-bold text-teal-700 hover:underline">Clear discovery filters</button></div>}</div></Plate><div className="space-y-5"><Plate className="risk-ledger p-5"><Stamp>Early warning</Stamp><h3 className="mt-2 text-[17px] font-bold tracking-[-0.03em]">Schedule condition has strengthened.</h3><p className="mt-3 text-[11px] leading-5 text-slate-600">The combined progress gap and delayed structural work now place the project within the current critical warning threshold.</p><div className="mt-4 flex items-center gap-2 font-mono text-[10px] font-bold text-red-600"><TrendingUp size={14} /> RISK +12 PP SINCE JAN</div></Plate><Plate className="p-5"><Stamp>Evidence note</Stamp><p className="mt-3 text-[11px] leading-5 text-slate-600">Evidence should be read alongside approved project reports, field updates, and official monitoring inputs.</p></Plate></div></div>; }
function HistoryTabEnhanced({ project }: { project: typeof projectCatalog[number] }) { const [query, setQuery] = useState(""); const [movement, setMovement] = useState("All movements"); const history = riskSeries(project).map((entry, index, all) => ({ ...entry, movement: index === 0 ? "Baseline" : `+${entry.risk - all[index - 1].risk}`, condition: index < 2 ? "Progress variance" : index < 4 ? "Milestone slippage" : project.primaryIssue })); const matching = history.filter((entry) => (movement === "All movements" || (movement === "Rising risk" && entry.movement !== "Baseline") || (movement === "Baseline" && entry.movement === "Baseline")) && `${entry.month} ${entry.condition} ${entry.risk}`.toLowerCase().includes(query.toLowerCase())); return <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]"><RiskHistoryPanel project={project} large /><Plate className="ledger-register overflow-hidden"><div className="border-b border-slate-100 p-5 sm:px-6"><Stamp>Reporting history</Stamp><h2 className="mt-1 text-[20px] font-bold tracking-[-0.04em]">Risk score across reporting periods</h2><div className="evidence-toolbar mt-5"><div className="evidence-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a reporting period or update" /></div><select value={movement} onChange={(event) => setMovement(event.target.value)} aria-label="Filter reporting movement"><option>All movements</option><option>Rising risk</option><option>Baseline</option></select></div></div><div className="overflow-x-auto"><table className="project-table"><thead><tr><th>Period</th><th>Risk score</th><th>Movement</th><th>Dominant condition</th></tr></thead><tbody>{matching.map((entry) => <tr key={entry.month}><td className="font-mono text-[11px] font-semibold text-slate-600">{entry.month} 2026</td><td className="font-mono text-[12px] font-bold text-[#172033]">{entry.risk}</td><td><span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold ${entry.movement === "Baseline" ? "text-slate-400" : "text-red-600"}`}>{entry.movement === "Baseline" ? "—" : <><TrendingUp size={12} /> {entry.movement}</>}</span></td><td className="text-[11px] text-slate-500">{entry.condition}</td></tr>)}</tbody></table>{matching.length === 0 && <div className="px-6 py-12 text-center"><Search className="mx-auto text-slate-300" size={24} /><p className="mt-3 text-[12px] font-bold text-slate-700">No reporting updates match this query.</p><button onClick={() => { setQuery(""); setMovement("All movements"); }} className="mt-2 text-[11px] font-bold text-teal-700 hover:underline">Clear discovery filters</button></div>}</div></Plate></div>; }
function exportDossierPdf(project: typeof projectCatalog[number]) { const doc = new jsPDF({ unit: "pt", format: "a4" }); const margin = 48; const rows = [["Project", project.name], ["Project ID", project.id], ["Ministry", project.ministry], ["Sector", project.sector], ["Location", project.state], ["Status", "Ongoing"], ["Overall risk", `${project.score}% · ${project.risk}`], ["Approved budget", project.budget], ["Revised budget", project.revised], ["Expenditure", project.spent], ["Forecast outturn", project.forecast], ["Physical progress", `${project.progress}%`], ["Financial progress", `${project.financialProgress}%`], ["Expected completion", project.expectedCompletion], ["Expected delay", project.delay], ["Primary risk", project.primaryIssue]]; doc.setFillColor(11, 105, 92); doc.rect(0, 0, 595, 86, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(21); doc.text("PAIMANA-AI | Project Dossier", margin, 38); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text("Infrastructure Intelligence · Generated project report", margin, 58); doc.setTextColor(23, 32, 51); doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.text(project.name, margin, 122); doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(`Project ID: ${project.id} · Monitoring snapshot`, margin, 140); let y = 175; rows.forEach(([label, value], index) => { if (index % 2 === 0) { doc.setFillColor(246, 248, 251); doc.rect(margin, y - 15, 500, 23, "F"); } doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(102, 112, 133); doc.text(label, margin + 10, y); doc.setFont("helvetica", "normal"); doc.setTextColor(23, 32, 51); doc.text(value, margin + 200, y); y += 24; }); doc.setFillColor(255, 247, 246); doc.rect(margin, y + 10, 500, 76, "F"); doc.setTextColor(180, 35, 24); doc.setFont("helvetica", "bold"); doc.text("EARLY WARNING", margin + 12, y + 30); doc.setTextColor(23, 32, 51); doc.setFont("helvetica", "normal"); doc.text("Schedule delay risk has increased; inspect progress gap and delayed milestones.", margin + 12, y + 49); doc.setFontSize(8); doc.setTextColor(102, 112, 133); doc.text("Risk indicators support review and do not replace official project monitoring inputs.", margin, 785); doc.save(`${project.id}-project-dossier.pdf`); }
function parseAmount(value: string) { return Number(value.replace(/[₹, Cr]/g, "")); }
function progressSeries(project: typeof projectCatalog[number]) { const final = project.progress; return [{ month: "Jan", planned: Math.max(20, final - 22), actual: Math.max(15, final - 30) }, { month: "Feb", planned: Math.max(28, final - 16), actual: Math.max(20, final - 25) }, { month: "Mar", planned: Math.max(36, final - 10), actual: Math.max(26, final - 18) }, { month: "Apr", planned: Math.max(45, final - 5), actual: Math.max(34, final - 12) }, { month: "May", planned: Math.min(92, final + 6), actual: Math.max(41, final - 5) }, { month: "Jun", planned: Math.min(96, final + 18), actual: final }]; }
function riskSeries(project: typeof projectCatalog[number]) { const first = Math.max(24, project.score - 57); return [{ month: "Jan", risk: first }, { month: "Feb", risk: first + 8 }, { month: "Mar", risk: first + 19 }, { month: "Apr", risk: first + 29 }, { month: "May", risk: first + 39 }, { month: "Jun", risk: project.score }]; }

export default function ProjectDossier({
  navigate,
  language,
}: {
  navigate: (path: string) => void;
  language: "EN" | "HI";
}) {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<DossierTab>("Overview");

  const [liveProject, setLiveProject] =
    useState<typeof projectCatalog[number] | null>(null);

  const [loading, setLoading] = useState(true);

  const projectId = location.split("/").filter(Boolean).pop();

  useEffect(() => {
    if (!projectId) return;

    // IMPORTANT:
    // Clear the previous project's data immediately.
    setLiveProject(null);
    setLoading(true);

    const controller = new AbortController();

    fetch(
      `${API_BASE}/api/projects/${encodeURIComponent(projectId)}`,
      {
        signal: controller.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Project not found");
        }

        return response.json();
      })
      .then((p) => {
        setLiveProject({
          id: String(p.ProjectCode),
          name: p.ProjectName || `Project ${p.ProjectCode}`,
          ministry: p.Agency || "—",
          sector: "Infrastructure",
          state: p.State || "—",

          progress: Number(
            p["Physical Progress"] ?? 0
          ),

          financialProgress: Number(
            p.CurrentExpenditureRatio ?? 0
          ),

          budget: `₹${Number(
            p.OriginalCost ?? 0
          ).toLocaleString("en-IN")} Cr`,

          revised: `₹${Number(
            p.RevisedCost ?? 0
          ).toLocaleString("en-IN")} Cr`,

          spent: `₹${Number(
            p.Expenditure ?? 0
          ).toLocaleString("en-IN")} Cr`,

          forecast: "Current forecast",

          score: Math.round(
            Number(
              p.OverallRiskScore ?? 0
            )
          ),

          risk:
            p.RiskLevel === "MEDIUM"
              ? "MODERATE"
              : (p.RiskLevel || "LOW") as RiskLevel,

          primaryIssue:
            p.AlertType === "COST_AND_TIME"
              ? "Cost & time exposure"
              : p.AlertType === "COST_RISK"
              ? "Cost exposure"
              : p.AlertType === "TIME_RISK"
              ? "Schedule exposure"
              : "Monitoring",

          delay: "Model-estimated",

          expectedCompletion:
            "Current forecast",
        });

        setLoading(false);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;

        console.error(
          "Failed to load project:",
          error
        );

        setLiveProject(null);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading project {projectId}...
        </div>
      </div>
    );
  }

  if (!liveProject) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-red-600">
          Project {projectId} could not be loaded.
        </div>
      </div>
    );
  }

  const project = liveProject;
  const selectedView = activeTab === "Overview" ? <OverviewTab project={project} setActive={setActiveTab} /> : activeTab === "Cost" ? <CostTab project={project} /> : activeTab === "Schedule" ? <ScheduleTab project={project} /> : activeTab === "Risk Factors" ? <RiskFactorsTab project={project} /> : activeTab === "Evidence" ? <EvidenceTabEnhanced project={project} /> : <HistoryTabEnhanced project={project} />;
  return <div className="project-dossier">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><button onClick={() => navigate("/projects?risk=critical")} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-teal-700"><ChevronLeft size={15} /> {language === "HI" ? "परियोजना रजिस्टर पर वापस जाएँ" : "Back to project register"}</button><Button onClick={() => exportDossierPdf(project)} className="h-9 rounded-lg bg-[#0b695c] px-3 text-[11px] font-bold text-white hover:bg-[#095b50]"><Download size={14} className="mr-1.5" /> {language === "HI" ? "पीडीएफ़ में निर्यात करें" : "Export to PDF"}</Button></div>
    <section className="project-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(23,32,51,0.98) 0%, rgba(23,32,51,0.92) 48%, rgba(23,32,51,0.52) 100%), url(${ASSETS.aerial})` }}><div className="max-w-2xl"><Stamp>Project dossier · {project.id}</Stamp><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.055em] text-white sm:text-4xl">{project.name}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-slate-300"><span className="inline-flex items-center gap-1.5"><Landmark size={13} />{project.ministry}</span><span className="inline-flex items-center gap-1.5"><MapPin size={13} />{project.state}</span><span>{project.sector}</span></div><div className="mt-7 flex flex-wrap gap-2"><RiskBadge level={project.risk} score={project.score} /><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-white">ONGOING</span></div></div><div className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-0"><div className="project-hero-stat col-span-2 sm:col-span-1"><Stamp>Overall risk</Stamp><div className="mt-3 font-mono text-4xl font-semibold tracking-[-0.08em] text-white">{project.score}</div><p className="mt-2 text-[11px] text-slate-300">{project.primaryIssue}</p></div><div className="project-hero-stat"><Stamp>Expected delay</Stamp><div className="mt-3 font-mono text-2xl font-semibold tracking-[-0.06em] text-white">{project.delay}</div><p className="mt-2 text-[11px] text-slate-300">Current forecast</p></div><div className="project-hero-stat"><Stamp>Completion</Stamp><div className="mt-3 font-mono text-2xl font-semibold tracking-[-0.06em] text-white">{project.expectedCompletion}</div><p className="mt-2 text-[11px] text-slate-300">Expected date</p></div></div></section>
    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><DossierKpi icon={Landmark} label="Approved budget" value={project.budget} detail="Original sanctioned cost" /><DossierKpi icon={WalletCards} label="Expenditure" value={project.spent} detail={`${project.financialProgress}% financial progress`} /><DossierKpi icon={TrendingDown} label="Physical progress" value={`${project.progress}%`} detail="Against planned trajectory" accent="risk" /><DossierKpi icon={CircleDollarSign} label="Financial progress" value={`${project.financialProgress}%`} detail="Cumulative drawdown" /></section>
    <TabBar active={activeTab} setActive={setActiveTab} language={language} />
    {selectedView}
  </div>;
}
