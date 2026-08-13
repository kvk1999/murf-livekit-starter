'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  SearchIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BadgeInfoIcon,
  HandshakeIcon,
  SirenIcon,
  BookOpenIcon,
  TrendingUpIcon,
  IndianRupeeIcon,
  TreesIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  FilterIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Escalation {
  id: number;
  call_id?: string;
  user_id?: string;
  issue_type: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
}

interface EscalationSummary {
  open: number;
  in_progress: number;
  resolved: number;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    open: {
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
      label: 'Open',
      icon: <AlertCircleIcon className="w-3 h-3" />,
    },
    in_progress: {
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      label: 'In Progress',
      icon: <ClockIcon className="w-3 h-3" />,
    },
    resolved: {
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      label: 'Resolved',
      icon: <CheckCircle2Icon className="w-3 h-3" />,
    },
  };
  const s = map[status] ?? map.open;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.color}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${map[priority] ?? map.medium}`}
    >
      {priority}
    </span>
  );
}

// ─── 1. Complaint Helpline ────────────────────────────────────────────────────

const HELPLINES = [
  {
    name: 'National Consumer Helpline',
    number: '1800-11-4000',
    short: '14404',
    desc: 'Consumer complaints against businesses, defective goods, service deficiency',
    icon: <PhoneIcon className="w-5 h-5 text-blue-500" />,
    color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
  },
  {
    name: 'Cyber Crime Helpline',
    number: '1930',
    short: '1930',
    desc: 'Report online fraud, financial cyber crime, UPI fraud immediately',
    icon: <SirenIcon className="w-5 h-5 text-rose-500" />,
    color: 'from-rose-500/10 to-rose-500/5 border-rose-500/20',
  },
  {
    name: 'PM Jan Dhan / Banking Helpline',
    number: '1800-11-0001',
    short: '—',
    desc: 'Issues with bank accounts, DBT transfers, Aadhaar-linked banking',
    icon: <IndianRupeeIcon className="w-5 h-5 text-emerald-500" />,
    color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
  },
  {
    name: 'GST Helpdesk',
    number: '1800-103-4786',
    short: '—',
    desc: 'GST registration, e-invoicing, GSTR filing complaints',
    icon: <BadgeInfoIcon className="w-5 h-5 text-violet-500" />,
    color: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
  },
  {
    name: 'SEBI SCORES (Investors)',
    number: '1800-266-7575',
    short: '—',
    desc: 'Investment / securities market complaints, mutual fund grievances',
    icon: <TrendingUpIcon className="w-5 h-5 text-amber-500" />,
    color: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
  },
  {
    name: 'IRDAI Insurance Helpline',
    number: '155255',
    short: '155255',
    desc: 'Insurance claim rejections, policy disputes, agent mis-selling',
    icon: <ShieldCheckIcon className="w-5 h-5 text-teal-500" />,
    color: 'from-teal-500/10 to-teal-500/5 border-teal-500/20',
  },
  {
    name: 'TRAI (Telecom Complaints)',
    number: '1800-110-010',
    short: '—',
    desc: 'Mobile network, call drop, DND violations, internet service issues',
    icon: <PhoneIcon className="w-5 h-5 text-indigo-500" />,
    color: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20',
  },
  {
    name: 'Labour & Employment Helpline',
    number: '1800-425-1514',
    short: '—',
    desc: 'Wage disputes, PF/ESIC grievances, workplace harassment',
    icon: <HandshakeIcon className="w-5 h-5 text-orange-500" />,
    color: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
  },
];

export const ComplaintHelplinePanel = ({ ref }: React.ComponentProps<'div'>) => {
  const [search, setSearch] = useState('');
  const filtered = HELPLINES.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card/60 backdrop-blur-xl p-6 rounded-2xl border border-border/80 shadow-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <PhoneIcon className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">
              24×7 Helplines
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Complaint Helpline Directory
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Official government & regulatory toll-free numbers for Indian citizens
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search helplines…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full bg-muted/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Grid */}
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((h) => (
          <div
            key={h.number}
            className={`rounded-2xl p-5 bg-gradient-to-br ${h.color} border shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-card/60 border border-border/40 shadow-sm">
                {h.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground leading-tight">{h.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{h.desc}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-xl font-black text-foreground font-mono tracking-wider">
                  {h.number}
                </div>
                {h.short !== '—' && (
                  <div className="text-[10px] text-muted-foreground">
                    Short code: <span className="font-bold text-foreground">{h.short}</span>
                  </div>
                )}
              </div>
              <a
                href={`tel:${h.number.replace(/-/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 border border-border/60 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-sm"
              >
                <PhoneIcon className="w-3.5 h-3.5" /> Call
              </a>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">
            No helplines match your search.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 2. Open Escalations ──────────────────────────────────────────────────────

export const OpenEscalationsPanel = ({ ref }: React.ComponentProps<'div'>) => {
  const [data, setData] = useState<{ escalations: Escalation[]; summary: EscalationSummary }>({  
    escalations: [],
    summary: { open: 0, in_progress: 0, resolved: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newForm, setNewForm] = useState({ issue_type: '', description: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchEscalations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/escalations');
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load escalations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEscalations();
    const interval = setInterval(fetchEscalations, 10000);
    return () => clearInterval(interval);
  }, [fetchEscalations]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch('/api/escalations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchEscalations();
    } catch (e) {
      console.error('Failed to update escalation:', e);
    }
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.issue_type.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      setNewForm({ issue_type: '', description: '', priority: 'medium' });
      setShowForm(false);
      fetchEscalations();
    } catch (e) {
      console.error('Failed to create escalation:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered =
    statusFilter === 'all'
      ? data.escalations
      : data.escalations.filter((e) => e.status === statusFilter);

  return (
    <div ref={ref} className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card/60 backdrop-blur-xl p-6 rounded-2xl border border-border/80 shadow-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangleIcon className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Live Tracker
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Open Escalations
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track and manage caller escalations requiring human follow-up
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEscalations}
            disabled={loading}
            className="rounded-full gap-1.5"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="rounded-full gap-1.5"
          >
            {showForm ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
            New Escalation
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', count: data.summary.open, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
          { label: 'In Progress', count: data.summary.in_progress, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Resolved', count: data.summary.resolved, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.bg} text-center`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* New escalation form */}
      {showForm && (
        <form
          onSubmit={handleSubmitNew}
          className="bg-card/70 backdrop-blur-xl border border-border/80 rounded-2xl p-5 space-y-3"
        >
          <h3 className="text-sm font-bold text-foreground">Log New Escalation</h3>
          <input
            required
            placeholder="Issue type (e.g., UPI fraud, loan query, scheme eligibility)"
            value={newForm.issue_type}
            onChange={(e) => setNewForm({ ...newForm, issue_type: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground"
          />
          <textarea
            placeholder="Description (optional)"
            rows={2}
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground resize-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={newForm.priority}
              onChange={(e) => setNewForm({ ...newForm, priority: e.target.value })}
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted/60 border border-border/60 text-sm focus:outline-none text-foreground"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <Button type="submit" size="sm" disabled={submitting} className="rounded-full px-6">
              {submitting ? 'Saving…' : 'Submit'}
            </Button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-full border border-border/40 w-fit">
        {['all', 'open', 'in_progress', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
              statusFilter === f
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/80 shadow-lg overflow-hidden">
        {error ? (
          <div className="p-6 text-center text-sm text-destructive">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <CheckCircle2Icon className="w-8 h-8 text-muted-foreground/40" />
            {loading ? 'Loading escalations…' : 'No escalations found for this filter.'}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((esc) => (
              <div key={esc.id} className="p-4 hover:bg-accent/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{esc.issue_type}</span>
                      <StatusBadge status={esc.status} />
                      <PriorityBadge priority={esc.priority} />
                    </div>
                    {esc.description && (
                      <p className="text-xs text-muted-foreground mt-1">{esc.description}</p>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-2 font-mono">
                      #{esc.id} · {esc.user_id} ·{' '}
                      {esc.created_at ? new Date(esc.created_at).toLocaleString() : 'Recent'}
                    </div>
                  </div>
                  <select
                    value={esc.status}
                    onChange={(e) => handleStatusChange(esc.id, e.target.value)}
                    className="text-xs rounded-lg px-2 py-1 bg-muted border border-border/60 text-foreground focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3. Fraud Prevention ─────────────────────────────────────────────────────

const FRAUD_TIPS = [
  {
    category: 'UPI & Digital Payments',
    icon: <IndianRupeeIcon className="w-4 h-4" />,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    tips: [
      'Never share your UPI PIN or OTP with anyone — not even "bank officials".',
      'UPI money requests DO NOT require your PIN. Entering PIN sends money OUT.',
      'Verify payee VPA (UPI ID) before every transaction, especially first-time.',
      'Enable transaction limits and SMS alerts in your banking app.',
      'Scammers pose as KYC update agents — there is no "KYC via call/link".',
    ],
  },
  {
    category: 'Loan & Investment Scams',
    icon: <TrendingUpIcon className="w-4 h-4" />,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    tips: [
      'Legitimate lenders NEVER ask for advance fee or "processing fee" upfront.',
      'Verify NBFC/bank registration on RBI website before borrowing.',
      'Guaranteed high returns (>12% p.a.) with no risk is always a red flag.',
      'Loan apps must be RBI-registered — check the Play Store/App Store listing.',
      'Chinese loan app harassment? Call Cyber Crime helpline 1930 immediately.',
    ],
  },
  {
    category: 'Govt. Scheme Impersonation',
    icon: <ShieldAlertIcon className="w-4 h-4" />,
    color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    tips: [
      'Government officials NEVER call asking for Aadhaar, PAN, or bank details.',
      'PM Kisan, Ujjwala Yojana, etc. credits come automatically — no middleman needed.',
      'Verify scheme status at official portals (pmkisan.gov.in, myscheme.gov.in).',
      'Fake "subsidy agents" charge commission — report to 1800-11-4000.',
      'WhatsApp scheme links are almost always fake. Check only .gov.in domains.',
    ],
  },
  {
    category: 'Social Engineering & Phishing',
    icon: <AlertTriangleIcon className="w-4 h-4" />,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    tips: [
      '"Your account will be blocked" calls are almost always scams. Hang up.',
      'Check SMS sender ID — your bank will have a registered 6-letter code.',
      'Never click shortened URLs (bit.ly, tinyurl) in SMS for banking purposes.',
      'Phone call with background noise + urgency = social engineering. Disconnect.',
      'Use TRAI\'s DND App to block promotional calls and report spam.',
    ],
  },
];

export const FraudPreventionPanel = ({ ref }: React.ComponentProps<'div'>) => {
  const [openCategories, setOpenCategories] = useState<string[]>([FRAUD_TIPS[0].category]);

  const toggle = (cat: string) => {
    setOpenCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div ref={ref} className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card/60 backdrop-blur-xl p-6 rounded-2xl border border-border/80 shadow-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldAlertIcon className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
              Safety Guide
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Fraud Prevention Centre
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Curated safety tips for Indian citizens — UPI, loans, government schemes & more
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          <SirenIcon className="w-4 h-4 text-rose-500" />
          <span>Fraud? Call <strong className="text-rose-500">1930</strong> now</span>
        </div>
      </div>

      {/* Emergency banner */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-background border border-rose-500/30 p-4 flex items-center gap-4">
        <SirenIcon className="w-8 h-8 text-rose-500 flex-shrink-0 animate-pulse" />
        <div>
          <p className="text-sm font-bold text-foreground">Lost money to fraud?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Report immediately at{' '}
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
              cybercrime.gov.in
            </a>{' '}
            or call <strong className="text-rose-500">1930</strong>. Time is critical — act within
            30 minutes for best chance of recovery.
          </p>
        </div>
      </div>

      {/* Accordion tips */}
      <div className="space-y-3">
        {FRAUD_TIPS.map((cat) => {
          const isOpen = openCategories.includes(cat.category);
          return (
            <div
              key={cat.category}
              className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/80 shadow overflow-hidden"
            >
              <button
                onClick={() => toggle(cat.category)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-lg border ${cat.color}`}>{cat.icon}</span>
                  <span className="text-sm font-bold text-foreground">{cat.category}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {cat.tips.length} tips
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {isOpen && (
                <ul className="px-5 pb-5 space-y-2">
                  {cat.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Cyber Crime Portal', url: 'https://cybercrime.gov.in', icon: <ExternalLinkIcon className="w-3.5 h-3.5" /> },
          { label: 'RBI Kehta Hai', url: 'https://rbi.org.in/scripts/PublicationsView.aspx?id=21259', icon: <ExternalLinkIcon className="w-3.5 h-3.5" /> },
          { label: 'SEBI SCORES', url: 'https://scores.sebi.gov.in', icon: <ExternalLinkIcon className="w-3.5 h-3.5" /> },
        ].map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-card/70 border border-border/70 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-sm"
          >
            {r.label}
            {r.icon}
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── 4. Schemes Search ────────────────────────────────────────────────────────

const SCHEMES = [
  {
    name: 'PM Kisan Samman Nidhi',
    category: 'Agriculture',
    icon: <TreesIcon className="w-4 h-4" />,
    benefit: '₹6,000/year in 3 instalments directly to farmer bank accounts',
    eligibility: 'Small & marginal farmers owning up to 2 hectares of cultivable land',
    apply: 'pmkisan.gov.in',
    applyUrl: 'https://pmkisan.gov.in',
    tags: ['farmer', 'agriculture', 'income', 'kisan'],
  },
  {
    name: 'PM Jan Dhan Yojana',
    category: 'Banking',
    icon: <IndianRupeeIcon className="w-4 h-4" />,
    benefit: 'Zero-balance bank account, RuPay card, ₹2L accident cover, ₹30K life cover',
    eligibility: 'Any Indian citizen above 10 years without a bank account',
    apply: 'pmjdy.gov.in',
    applyUrl: 'https://pmjdy.gov.in',
    tags: ['bank', 'account', 'zero balance', 'jan dhan'],
  },
  {
    name: 'PM Ujjwala Yojana 2.0',
    category: 'Energy',
    icon: <HeartHandshakeIcon className="w-4 h-4" />,
    benefit: 'Free LPG connection + first refill + regulator for BPL households',
    eligibility: 'Women aged 18+ from BPL/SC/ST/PMAY/Antyodaya households',
    apply: 'pmuy.gov.in',
    applyUrl: 'https://www.pmuy.gov.in',
    tags: ['lpg', 'gas', 'bpl', 'women', 'ujjwala'],
  },
  {
    name: 'Ayushman Bharat – PMJAY',
    category: 'Health',
    icon: <HeartHandshakeIcon className="w-4 h-4" />,
    benefit: '₹5 lakh/year health cover for secondary & tertiary hospitalisation',
    eligibility: 'Bottom 40% of population as per SECC database (auto-identified)',
    apply: 'pmjay.gov.in',
    applyUrl: 'https://pmjay.gov.in',
    tags: ['health', 'hospital', 'insurance', 'ayushman'],
  },
  {
    name: 'PM Mudra Yojana',
    category: 'Finance',
    icon: <IndianRupeeIcon className="w-4 h-4" />,
    benefit: 'Collateral-free loans: Shishu ≤₹50K, Kishor ≤₹5L, Tarun ≤₹10L',
    eligibility: 'Non-farm micro/small businesses, artisans, traders, vendors',
    apply: 'mudra.org.in',
    applyUrl: 'https://www.mudra.org.in',
    tags: ['loan', 'mudra', 'business', 'self employment', 'mudra'],
  },
  {
    name: 'PM Skill India (PMKVY)',
    category: 'Skill',
    icon: <GraduationCapIcon className="w-4 h-4" />,
    benefit: 'Free skill training + ₹8,000 reward + placement support',
    eligibility: 'Youth 15–45 years, school/college dropouts or jobseekers',
    apply: 'pmkvyofficial.org',
    applyUrl: 'https://www.pmkvyofficial.org',
    tags: ['skill', 'training', 'youth', 'job', 'pmkvy'],
  },
  {
    name: 'National Pension System (NPS)',
    category: 'Finance',
    icon: <TrendingUpIcon className="w-4 h-4" />,
    benefit: 'Market-linked pension; employer contribution + ₹50K additional tax deduction',
    eligibility: 'Indian citizens 18–70 years (Tier I mandatory for govt employees)',
    apply: 'enps.nsdl.com',
    applyUrl: 'https://enps.nsdl.com',
    tags: ['pension', 'retirement', 'nps', 'savings'],
  },
  {
    name: 'Pradhan Mantri Awas Yojana (Urban)',
    category: 'Housing',
    icon: <ShieldCheckIcon className="w-4 h-4" />,
    benefit: 'Interest subsidy of 3–6.5% on home loans; EWS/LIG get up to ₹2.67L subsidy',
    eligibility: 'EWS (income ≤₹3L), LIG (₹3–6L), MIG I/II (₹6–18L) without pucca house',
    apply: 'pmaymis.gov.in',
    applyUrl: 'https://pmaymis.gov.in',
    tags: ['house', 'home', 'loan', 'awas', 'pmay', 'subsidy'],
  },
  {
    name: 'Stand-Up India Scheme',
    category: 'Entrepreneurship',
    icon: <TrendingUpIcon className="w-4 h-4" />,
    benefit: 'Bank loans ₹10L–₹1Cr for greenfield enterprises in manufacturing/services/trade',
    eligibility: 'SC/ST or women entrepreneurs setting up first enterprise',
    apply: 'standupmitra.in',
    applyUrl: 'https://www.standupmitra.in',
    tags: ['sc', 'st', 'women', 'startup', 'entrepreneur', 'loan'],
  },
  {
    name: 'Sukanya Samriddhi Yojana',
    category: 'Finance',
    icon: <IndianRupeeIcon className="w-4 h-4" />,
    benefit: '8.2% p.a. interest (tax-free), ₹250–₹1.5L/year deposit for girl child',
    eligibility: 'Girl child below 10 years; account opened by parent/guardian',
    apply: 'Post office or authorised bank',
    applyUrl: 'https://www.indiapost.gov.in',
    tags: ['girl', 'daughter', 'savings', 'sukanya', 'education'],
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(SCHEMES.map((s) => s.category)))];

export const SchemesSearchPanel = ({ ref }: React.ComponentProps<'div'>) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SCHEMES.filter((s) => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.benefit.toLowerCase().includes(q) ||
      s.eligibility.toLowerCase().includes(q) ||
      s.tags.some((t) => t.includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div ref={ref} className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card/60 backdrop-blur-xl p-6 rounded-2xl border border-border/80 shadow-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpenIcon className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-500">
              Government Schemes
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Schemes Search
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Search and explore central government schemes — benefits, eligibility & application
          </p>
        </div>
        <a
          href="https://myscheme.gov.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-500 hover:bg-violet-500/20 transition-colors"
        >
          <ExternalLinkIcon className="w-3.5 h-3.5" /> myScheme.gov.in
        </a>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, benefit, eligibility…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-muted/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <FilterIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing <strong className="text-foreground">{filtered.length}</strong> of {SCHEMES.length}{' '}
        schemes
      </p>

      {/* Scheme cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No schemes match your search. Try different keywords.
          </div>
        ) : (
          filtered.map((scheme) => {
            const isExpanded = expanded === scheme.name;
            return (
              <div
                key={scheme.name}
                className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/80 shadow overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : scheme.name)}
                  className="w-full flex items-start justify-between gap-3 p-5 text-left hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 flex-shrink-0">
                      {scheme.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{scheme.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground font-medium">
                          {scheme.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {scheme.benefit}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3 border-t border-border/40">
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Benefit
                        </p>
                        <p className="text-xs text-foreground leading-relaxed">{scheme.benefit}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Eligibility
                        </p>
                        <p className="text-xs text-foreground leading-relaxed">
                          {scheme.eligibility}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {scheme.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => { setSearch(tag); setExpanded(null); }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 hover:bg-violet-500/20 transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                      <a
                        href={scheme.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Apply / Check <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
