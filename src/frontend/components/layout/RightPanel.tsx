import React from 'react';
import { Tab } from '../../stores/ui.store';

/* ── Shared card wrapper ── */
function PanelCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-3">
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-matrix-border/40">
        <span className="text-xs text-matrix-muted">{icon}</span>
        <h3 className="text-xs font-medium text-gray-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-matrix-border/50 rounded-full h-1">
      <div className={`${color} h-1 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Mock data ── */

const MOCK_DEADLINES = [
  { title: 'Finalize API contracts', date: 'Mar 12', priority: 'high', daysLeft: 3 },
  { title: 'Design review meeting', date: 'Mar 14', priority: 'medium', daysLeft: 5 },
  { title: 'Deploy staging build', date: 'Mar 15', priority: 'urgent', daysLeft: 6 },
  { title: 'Update documentation', date: 'Mar 18', priority: 'low', daysLeft: 9 },
  { title: 'Sprint retrospective', date: 'Mar 20', priority: 'medium', daysLeft: 11 },
];

const MOCK_FOCUS = {
  currentTask: 'Implement drag-and-drop',
  pomodorosToday: 5,
  pomodorosGoal: 8,
  focusMinutes: 125,
  breakMinutes: 25,
};

const MOCK_STREAK = {
  currentStreak: 12,
  longestStreak: 23,
  tasksThisWeek: 17,
  avgPerDay: 3.4,
  weekData: [4, 2, 5, 3, 1, 2, 0], // Mon-Sun
};

const MOCK_BURNDOWN = [
  { day: 'Mon', remaining: 24, completed: 3 },
  { day: 'Tue', remaining: 21, completed: 5 },
  { day: 'Wed', remaining: 18, completed: 4 },
  { day: 'Thu', remaining: 15, completed: 6 },
  { day: 'Fri', remaining: 12, completed: 3 },
  { day: 'Sat', remaining: 10, completed: 2 },
  { day: 'Sun', remaining: 9, completed: 1 },
];

const MOCK_TECH_RADAR = [
  { name: 'React 19', ring: 'Adopt', status: 'ready' },
  { name: 'Bun runtime', ring: 'Trial', status: 'testing' },
  { name: 'Drizzle ORM', ring: 'Adopt', status: 'ready' },
  { name: 'tRPC', ring: 'Assess', status: 'evaluating' },
  { name: 'Tauri', ring: 'Hold', status: 'watching' },
  { name: 'Effect-TS', ring: 'Assess', status: 'evaluating' },
];

const MOCK_DEPS_HEALTH = [
  { name: 'electron', current: '40.0.0', latest: '40.1.2', status: 'minor' },
  { name: 'react', current: '18.3.1', latest: '19.0.0', status: 'major' },
  { name: 'drizzle-orm', current: '0.38.0', latest: '0.38.4', status: 'patch' },
  { name: 'tailwindcss', current: '3.4.17', latest: '3.4.17', status: 'ok' },
  { name: 'recharts', current: '3.8.0', latest: '3.8.0', status: 'ok' },
  { name: 'zod', current: '3.24.2', latest: '3.24.4', status: 'patch' },
];

const MOCK_TOP_IDEAS = [
  { title: 'AI-powered task estimation', score: 8.7, status: 'approved' },
  { title: 'Calendar integration', score: 7.9, status: 'evaluating' },
  { title: 'Custom theme editor', score: 7.2, status: 'pending' },
  { title: 'Export to PDF reports', score: 6.8, status: 'approved' },
  { title: 'Voice command input', score: 5.4, status: 'pending' },
];

const MOCK_KPIS = [
  { label: 'Velocity', value: '14.2', unit: 'pts/sprint', trend: '+12%', up: true },
  { label: 'Cycle Time', value: '2.3', unit: 'days', trend: '-8%', up: true },
  { label: 'Throughput', value: '3.4', unit: 'tasks/day', trend: '+5%', up: true },
  { label: 'WIP Limit', value: '4/5', unit: 'tasks', trend: '—', up: false },
];

const MOCK_TRENDS = [
  { week: 'W1', completed: 8, created: 12 },
  { week: 'W2', completed: 14, created: 10 },
  { week: 'W3', completed: 11, created: 9 },
  { week: 'W4', completed: 16, created: 13 },
];

const MOCK_SHORTCUTS = [
  { keys: 'Ctrl+N', action: 'New task' },
  { keys: 'Ctrl+I', action: 'New idea' },
  { keys: 'Ctrl+/', action: 'Search' },
  { keys: 'Ctrl+1-6', action: 'Switch tab' },
  { keys: 'Ctrl+B', action: 'Toggle sidebar' },
  { keys: 'Esc', action: 'Close modal' },
];

const QUOTES = [
  { text: 'Strategy without tactics is the slowest route to victory.', author: 'Sun Tzu' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Plans are nothing; planning is everything.', author: 'Eisenhower' },
];

/* ── Priority / status helpers ── */
const priorityColor: Record<string, string> = {
  low: 'text-gray-500', medium: 'text-blue-400', high: 'text-orange-400', urgent: 'text-red-400',
};
const daysLeftColor = (d: number) => d <= 3 ? 'text-red-400' : d <= 7 ? 'text-amber-400' : 'text-gray-500';
const ringColor: Record<string, string> = {
  Adopt: 'bg-green-500/10 text-green-400',
  Trial: 'bg-blue-500/10 text-blue-400',
  Assess: 'bg-amber-500/10 text-amber-400',
  Hold: 'bg-red-500/10 text-red-400',
};
const depStatusColor: Record<string, string> = {
  ok: 'text-green-400', patch: 'text-blue-400', minor: 'text-amber-400', major: 'text-red-400',
};
const depStatusIcon: Record<string, string> = {
  ok: '✓', patch: '↑', minor: '↑', major: '⚠',
};

/* ── Widget components ── */

function UpcomingDeadlines() {
  return (
    <PanelCard title="Upcoming Deadlines" icon="⏰">
      <div className="space-y-1.5">
        {MOCK_DEADLINES.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`${daysLeftColor(d.daysLeft)} font-mono w-6 text-right shrink-0`}>{d.daysLeft}d</span>
            <span className="text-gray-400 flex-1 truncate">{d.title}</span>
            <span className={`${priorityColor[d.priority]} text-[10px]`}>{d.priority}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function DailyFocus() {
  return (
    <PanelCard title="Daily Focus" icon="◉">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-matrix-accent text-xs">▸</span>
          <span className="text-xs text-gray-300 truncate">{MOCK_FOCUS.currentTask}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-matrix-muted">Pomodoros</span>
          <div className="flex gap-0.5 flex-1">
            {Array.from({ length: MOCK_FOCUS.pomodorosGoal }).map((_, i) => (
              <div key={i} className={`h-3 flex-1 rounded-sm ${i < MOCK_FOCUS.pomodorosToday ? 'bg-matrix-accent' : 'bg-matrix-border/50'}`} />
            ))}
          </div>
          <span className="text-[10px] text-matrix-muted">{MOCK_FOCUS.pomodorosToday}/{MOCK_FOCUS.pomodorosGoal}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-200">{MOCK_FOCUS.focusMinutes}m</p>
            <p className="text-[10px] text-matrix-muted">Focus time</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200">{MOCK_FOCUS.breakMinutes}m</p>
            <p className="text-[10px] text-matrix-muted">Break time</p>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

function MotivationalQuote() {
  const q = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length]; // rotates daily
  return (
    <PanelCard title="Daily Thought" icon="✧">
      <blockquote className="text-xs text-gray-400 italic leading-relaxed">
        "{q.text}"
      </blockquote>
      <p className="text-[10px] text-matrix-muted mt-1.5 text-right">— {q.author}</p>
    </PanelCard>
  );
}

function ProductivityStreak() {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const maxVal = Math.max(...MOCK_STREAK.weekData, 1);
  return (
    <PanelCard title="Productivity" icon="🔥">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-matrix-accent">{MOCK_STREAK.currentStreak}</p>
            <p className="text-[10px] text-matrix-muted">Day streak</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-300">{MOCK_STREAK.longestStreak}</p>
            <p className="text-[10px] text-matrix-muted">Best streak</p>
          </div>
        </div>
        <div>
          <div className="flex items-end gap-1 h-12">
            {MOCK_STREAK.weekData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t-sm bg-matrix-accent/70 transition-all" style={{ height: `${(v / maxVal) * 100}%`, minHeight: v > 0 ? '2px' : '0' }} />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-0.5">
            {dayLabels.map((d, i) => (
              <span key={i} className="flex-1 text-center text-[9px] text-matrix-muted">{d}</span>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-matrix-muted">
          <span>{MOCK_STREAK.tasksThisWeek} tasks this week</span>
          <span>~{MOCK_STREAK.avgPerDay}/day</span>
        </div>
      </div>
    </PanelCard>
  );
}

function TaskBurndown() {
  const maxRemaining = Math.max(...MOCK_BURNDOWN.map(d => d.remaining), 1);
  return (
    <PanelCard title="Weekly Burndown" icon="📉">
      <div className="space-y-1">
        {MOCK_BURNDOWN.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-matrix-muted w-6 shrink-0">{d.day}</span>
            <div className="flex-1">
              <MiniBar value={d.remaining} max={maxRemaining} color="bg-amber-500/70" />
            </div>
            <span className="text-[10px] text-gray-500 w-5 text-right">{d.remaining}</span>
            <span className="text-[10px] text-green-400/70 w-5 text-right">+{d.completed}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function TechRadar() {
  return (
    <PanelCard title="Tech Radar" icon="📡">
      <div className="space-y-1.5">
        {MOCK_TECH_RADAR.map((tech, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-gray-300 flex-1 truncate">{tech.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ringColor[tech.ring]}`}>{tech.ring}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function DependenciesHealth() {
  return (
    <PanelCard title="Dependencies Health" icon="📦">
      <div className="space-y-1.5">
        {MOCK_DEPS_HEALTH.map((dep, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`${depStatusColor[dep.status]} text-[10px] w-3 text-center`}>{depStatusIcon[dep.status]}</span>
            <span className="text-gray-400 flex-1 truncate">{dep.name}</span>
            <span className="text-[10px] font-mono text-matrix-muted">{dep.current}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-1.5 border-t border-matrix-border/30 flex justify-between text-[10px] text-matrix-muted">
        <span>{MOCK_DEPS_HEALTH.filter(d => d.status === 'ok').length} up to date</span>
        <span>{MOCK_DEPS_HEALTH.filter(d => d.status === 'major').length} major update</span>
      </div>
    </PanelCard>
  );
}

function TopScoredIdeas() {
  const statusBadge: Record<string, string> = {
    approved: 'bg-green-500/10 text-green-400',
    evaluating: 'bg-blue-500/10 text-blue-400',
    pending: 'bg-gray-500/10 text-gray-400',
  };
  return (
    <PanelCard title="Top Scored Ideas" icon="💡">
      <div className="space-y-1.5">
        {MOCK_TOP_IDEAS.map((idea, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-matrix-accent font-mono text-[10px] w-6 text-right shrink-0">{idea.score}</span>
            <span className="text-gray-400 flex-1 truncate">{idea.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusBadge[idea.status] || statusBadge.pending}`}>{idea.status}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function IdeaFunnel() {
  const stages = [
    { label: 'Captured', count: 24, color: 'bg-gray-500' },
    { label: 'Evaluating', count: 8, color: 'bg-blue-500' },
    { label: 'Approved', count: 5, color: 'bg-green-500' },
    { label: 'Promoted', count: 3, color: 'bg-purple-500' },
  ];
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  return (
    <PanelCard title="Idea Funnel" icon="🔽">
      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={i}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-gray-400">{s.label}</span>
              <span className="text-matrix-muted">{s.count}</span>
            </div>
            <div className="w-full bg-matrix-border/50 rounded-full h-1.5">
              <div className={`${s.color}/70 h-1.5 rounded-full transition-all`} style={{ width: `${(s.count / maxCount) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function KeyMetrics() {
  return (
    <PanelCard title="Key Metrics" icon="📊">
      <div className="grid grid-cols-2 gap-2">
        {MOCK_KPIS.map((kpi, i) => (
          <div key={i} className="text-center py-1.5 bg-matrix-bg/50 rounded">
            <p className="text-sm font-semibold text-gray-200">{kpi.value}</p>
            <p className="text-[9px] text-matrix-muted">{kpi.unit}</p>
            <p className={`text-[10px] mt-0.5 ${kpi.up ? 'text-green-400' : 'text-matrix-muted'}`}>{kpi.trend}</p>
            <p className="text-[10px] text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function WeeklyTrends() {
  const maxVal = Math.max(...MOCK_TRENDS.flatMap(t => [t.completed, t.created]), 1);
  return (
    <PanelCard title="Weekly Trends" icon="📈">
      <div className="space-y-1.5">
        {MOCK_TRENDS.map((w, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-matrix-muted w-5">{w.week}</span>
              <div className="flex-1 flex gap-0.5">
                <div className="h-2 bg-green-500/60 rounded-sm" style={{ width: `${(w.completed / maxVal) * 100}%` }} />
                <div className="h-2 bg-blue-500/40 rounded-sm" style={{ width: `${(w.created / maxVal) * 100}%` }} />
              </div>
              <span className="text-green-400/70 w-5 text-right">{w.completed}</span>
              <span className="text-blue-400/50 w-5 text-right">{w.created}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 pt-1.5 border-t border-matrix-border/30 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/60" /> Completed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/40" /> Created</span>
      </div>
    </PanelCard>
  );
}

function ShortcutsHelp() {
  return (
    <PanelCard title="Keyboard Shortcuts" icon="⌨">
      <div className="space-y-1.5">
        {MOCK_SHORTCUTS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <kbd className="text-[10px] bg-matrix-bg border border-matrix-border rounded px-1.5 py-0.5 font-mono text-matrix-muted shrink-0">{s.keys}</kbd>
            <span className="text-gray-400">{s.action}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function SystemStatus() {
  const items = [
    { label: 'API Server', status: 'online', color: 'bg-green-400' },
    { label: 'Database', status: 'healthy', color: 'bg-green-400' },
    { label: 'Sync', status: 'local only', color: 'bg-amber-400' },
    { label: 'Backups', status: 'not configured', color: 'bg-gray-500' },
  ];
  return (
    <PanelCard title="System Status" icon="⚡">
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
            <span className="text-gray-400 flex-1">{item.label}</span>
            <span className="text-[10px] text-matrix-muted">{item.status}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

/* ── Panel configurations per tab ── */

const PANEL_CONFIG: Record<Tab, React.FC[]> = {
  overview: [DailyFocus, UpcomingDeadlines, ProductivityStreak, MotivationalQuote],
  tasks: [ProductivityStreak, TaskBurndown, UpcomingDeadlines],
  projects: [TechRadar, DependenciesHealth, SystemStatus],
  ideas: [IdeaFunnel, TopScoredIdeas, MotivationalQuote],
  analytics: [KeyMetrics, WeeklyTrends, ProductivityStreak],
  settings: [ShortcutsHelp, SystemStatus, MotivationalQuote],
};

/* ── Main export ── */

export function RightPanel({ activeTab }: { activeTab: Tab }) {
  const widgets = PANEL_CONFIG[activeTab] || PANEL_CONFIG.overview;

  return (
    <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-matrix-border bg-matrix-surface/50 overflow-y-auto">
      <div className="p-3 space-y-3">
        {widgets.map((Widget, i) => (
          <Widget key={i} />
        ))}
      </div>
    </aside>
  );
}
