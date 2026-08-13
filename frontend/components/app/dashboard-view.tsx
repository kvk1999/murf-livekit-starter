'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCallIcon,
  CheckCircle2Icon,
  XCircleIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ActivityIcon,
  InfoIcon,
  LockIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallMetricData {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
  history: Array<{
    call_id: string;
    room_name: string;
    start_time: string;
    end_time: string;
    outcome: string;
    reason: string;
    user_id: string;
    turns: number;
    created_at: string;
  }>;
  policy?: string;
}

export function CallAnalyticsDashboard() {
  const [data, setData] = useState<CallMetricData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/calls/stats');
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
      const json: CallMetricData = await res.json();
      setData(json);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Failed to fetch call stats:', err);
      setError(err.message || 'Failed to load call metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const total = data?.total_calls ?? 0;
  const successful = data?.successful_calls ?? 0;
  const failed = data?.failed_calls ?? 0;
  const rate = data?.success_rate ?? 0;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-xl p-6 rounded-2xl border border-border/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Live Agent Telemetry
            </span>
            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/5">
              <LockIcon className="w-3 h-3 mr-1" /> Privacy Protected
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Call Outcome & Performance Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time telemetry for LiveKit browser & SIP audio calls.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Updated: {lastUpdated}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="rounded-full gap-1.5 shadow-sm hover:bg-accent transition-all"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success policy explanation card (Step 1 requirement) */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-primary/5 via-accent/30 to-background border border-primary/20 shadow-md">
        <div className="flex items-center gap-2.5 mb-2">
          <ShieldCheckIcon className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            Step 1: Definition of a Successful Call
          </h3>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-foreground/80">
          A call is evaluated as <strong className="text-emerald-500 font-semibold">SUCCESSFUL</strong> when the agent completes a user inquiry (such as scheme guidance, weather report, caller registration, or creating a human escalation with explicit verbal consent) with active interactive turns.
          A call is marked as <strong className="text-rose-500 font-semibold">FAILED</strong> if the user disconnects before any interaction, or if an unhandled session error occurs.
        </p>
      </div>

      {/* 3 Main Metric Cards (Step 3 requirement) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Calls Card */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/80 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PhoneCallIcon className="w-24 h-24 text-primary" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Calls</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <PhoneCallIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-foreground tracking-tight">{total}</div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <ActivityIcon className="w-3.5 h-3.5 text-primary" /> Total sessions recorded
          </p>
        </div>

        {/* Successful Calls Card */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/30 shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2Icon className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Successful Calls</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
              <CheckCircle2Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-emerald-500 tracking-tight">{successful}</div>
          <div className="mt-3 w-full bg-emerald-950/20 rounded-full h-2 overflow-hidden border border-emerald-500/20">
            <div
              className="bg-gradient-to-r from-emerald-500 to-green-400 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
            />
          </div>
          <p className="text-xs text-emerald-500/90 font-medium mt-2">
            {rate}% Success Rate achieved
          </p>
        </div>

        {/* Failed Calls Card */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-rose-500/10 via-card to-card border border-rose-500/30 shadow-xl hover:shadow-rose-500/10 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <XCircleIcon className="w-24 h-24 text-rose-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">Failed Calls</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
              <XCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-rose-500 tracking-tight">{failed}</div>
          <p className="text-xs text-rose-500/80 font-medium mt-3">
            Early dropouts or unhandled session errors
          </p>
        </div>
      </div>

      {/* Step 6 Privacy Notice & Recent Calls Table */}
      <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/80 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Recent Call Logs
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                Real DB Records
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Caller privacy enforced: OTPs, PINs, bank accounts, and full transcripts are omitted.
            </p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <LockIcon className="w-3.5 h-3.5 text-emerald-500" /> Masked & Redacted
          </div>
        </div>

        <div className="p-0">
          {error ? (
            <div className="p-6 text-center text-sm text-destructive">{error}</div>
          ) : !data || data.history.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <InfoIcon className="w-8 h-8 text-muted-foreground/50 animate-bounce" />
              No call records found in database yet. Make a browser call or run test scripts to see real telemetry!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Call ID / Room</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4 text-center">Turns</th>
                    <th className="py-3 px-4 text-right">Logged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.history.map((item) => {
                    const isSuccess = item.outcome.toLowerCase() === 'success';
                    return (
                      <tr key={item.call_id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="font-semibold text-foreground">{item.call_id}</div>
                          <div className="text-[11px] text-muted-foreground">{item.room_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                              <CheckCircle2Icon className="w-3 h-3" /> SUCCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                              <XCircleIcon className="w-3 h-3" /> FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">
                          {item.reason}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-foreground">
                          {item.turns}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Recent'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
