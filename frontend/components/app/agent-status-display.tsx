'use client';

import React from 'react';
import { type AgentState } from '@livekit/components-react';
import { cn } from '@/lib/shadcn/utils';

// ── Connecting animated dots ───────────────────────────────────────────────
function ConnectingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-amber-500"
          style={{
            animation: 'bounce-dot 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Waveform animation for "Speaking" ─────────────────────────────────────
function WaveformAnimation({ bars = 7 }: { bars?: number }) {
  return (
    <div className="flex items-end justify-center gap-[3px]" style={{ height: 32 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="rounded-full bg-primary"
          style={{
            width: 4,
            minHeight: 4,
            animation: `waveform-bar 0.8s ease-in-out infinite alternate`,
            animationDelay: `${(i / bars) * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Listening pulse ring ───────────────────────────────────────────────────
function ListeningPulse() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
      <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 shadow" />
    </div>
  );
}

// ── Thinking dots (violet) ─────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-violet-500"
          style={{
            animation: 'bounce-dot 0.8s infinite ease-in-out',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main AgentStatusDisplay ────────────────────────────────────────────────
interface AgentStatusDisplayProps {
  agentState: AgentState;
  className?: string;
}

const STATE_CONFIG: Record<
  AgentState,
  { label: string; sublabel: string; badge: string; badgeColor: string }
> = {
  connecting: {
    label: 'Connecting…',
    sublabel: 'Please wait while the agent joins the call',
    badge: 'Connecting',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  initializing: {
    label: 'Starting up…',
    sublabel: 'The agent is initialising, please wait',
    badge: 'Starting',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  listening: {
    label: 'Listening to you',
    sublabel: 'Speak now — the agent is paying attention',
    badge: 'Listening',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  thinking: {
    label: 'Thinking…',
    sublabel: 'Processing your message, a moment please',
    badge: 'Thinking',
    badgeColor: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
  },
  speaking: {
    label: 'Agent is speaking',
    sublabel: 'Kathirvelan Karthik is replying to you',
    badge: 'Speaking',
    badgeColor: 'bg-primary/15 text-primary border-primary/30',
  },
  offline: {
    label: 'Call ended',
    sublabel: 'The conversation has finished',
    badge: 'Offline',
    badgeColor: 'bg-muted text-muted-foreground border-border',
  },
};

export function AgentStatusDisplay({ agentState, className }: AgentStatusDisplayProps) {
  const config = STATE_CONFIG[agentState] ?? STATE_CONFIG['connecting'];

  const visual =
    agentState === 'connecting' || agentState === 'initializing' ? (
      <ConnectingDots />
    ) : agentState === 'listening' ? (
      <ListeningPulse />
    ) : agentState === 'speaking' ? (
      <WaveformAnimation bars={7} />
    ) : agentState === 'thinking' ? (
      <ThinkingDots />
    ) : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 py-2 text-center transition-all duration-500',
        className
      )}
    >
      {/* Visual indicator */}
      <div className="flex h-10 items-center justify-center">{visual}</div>

      {/* State badge */}
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold tracking-wide transition-all duration-300',
          config.badgeColor
        )}
      >
        {config.badge}
      </span>

      {/* State labels */}
      <p className="text-sm font-semibold text-foreground leading-tight">{config.label}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{config.sublabel}</p>
    </div>
  );
}
