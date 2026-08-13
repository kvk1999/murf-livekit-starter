'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Loader2Icon,
  PhoneCallIcon,
  BarChart3Icon,
  PhoneIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  BookOpenIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { ConnectionState } from 'livekit-client';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';
import { CallAnalyticsDashboard } from '@/components/app/dashboard-view';
import { PostCallFeedbackView } from '@/components/app/post-call-feedback';
import {
  ComplaintHelplinePanel,
  OpenEscalationsPanel,
  FraudPreventionPanel,
  SchemesSearchPanel,
} from '@/components/app/info-panels';
import { Button } from '@/components/ui/button';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);
const MotionDashboardView = motion.create(CallAnalyticsDashboard);
const MotionPostCallFeedback = motion.create(PostCallFeedbackView);
const MotionComplaintHelpline = motion.create(ComplaintHelplinePanel);
const MotionOpenEscalations = motion.create(OpenEscalationsPanel);
const MotionFraudPrevention = motion.create(FraudPreventionPanel);
const MotionSchemesSearch = motion.create(SchemesSearchPanel);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 12 },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: { duration: 0.4, ease: 'easeOut' },
};

type ActiveTab =
  | 'assistant'
  | 'dashboard'
  | 'helpline'
  | 'escalations'
  | 'fraud'
  | 'schemes';

interface NavTab {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const NAV_TABS: NavTab[] = [
  {
    id: 'assistant',
    label: 'Voice Assistant',
    shortLabel: 'Assistant',
    icon: <PhoneCallIcon className="w-3.5 h-3.5" />,
  },
  {
    id: 'dashboard',
    label: 'Call Analytics',
    shortLabel: 'Analytics',
    icon: <BarChart3Icon className="w-3.5 h-3.5" />,
  },
  {
    id: 'helpline',
    label: 'Complaint Helpline',
    shortLabel: 'Helpline',
    icon: <PhoneIcon className="w-3.5 h-3.5" />,
  },
  {
    id: 'escalations',
    label: 'Open Escalations',
    shortLabel: 'Escalations',
    icon: <AlertTriangleIcon className="w-3.5 h-3.5" />,
  },
  {
    id: 'fraud',
    label: 'Fraud Prevention',
    shortLabel: 'Fraud',
    icon: <ShieldAlertIcon className="w-3.5 h-3.5" />,
  },
  {
    id: 'schemes',
    label: 'Schemes Search',
    shortLabel: 'Schemes',
    icon: <BookOpenIcon className="w-3.5 h-3.5" />,
  },
];

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start, connectionState } = useSessionContext();
  const isConnecting = connectionState === ConnectionState.Connecting;
  const { resolvedTheme } = useTheme();
  const [micError, setMicError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('assistant');

  // ── Post-call feedback state ───────────────────────────────────────────────
  // showPostCall becomes true when a call that WAS connected has now ended.
  const [showPostCall, setShowPostCall] = useState(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (isConnected) {
      // Mark that a call was active
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current) {
      // Call just ended — show the post-call feedback screen
      wasConnectedRef.current = false;
      setShowPostCall(true);
    }
  }, [isConnected]);

  const handleFeedbackDone = () => {
    setShowPostCall(false);
    setActiveTab('assistant');
  };

  // ── Mic permission check ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        if (result.state === 'denied') {
          setMicError(
            'Your microphone is blocked. The agent cannot hear you without microphone access.'
          );
        }
        result.onchange = () => {
          if (result.state === 'denied') {
            setMicError(
              'Your microphone is blocked. The agent cannot hear you without microphone access.'
            );
          } else {
            setMicError(null);
          }
        };
      })
      .catch(() => {
        // Permission API not supported or query failed — silently ignore
      });
  }, []);

  const handleStartCall = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicError(null);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setMicError(
          'Microphone access was denied. Please allow microphone access in your browser to use the voice agent.'
        );
        return;
      }
    }
    start();
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Top Header Navigation — hidden during call and post-call */}
      {!isConnected && !isConnecting && !showPostCall && (
        <div className="sticky top-0 z-50 flex items-center justify-center p-3 bg-background/80 backdrop-blur-md border-b border-border/60">
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-full border border-border/50 shadow-inner overflow-x-auto max-w-full scrollbar-hide">
            {NAV_TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="rounded-full text-xs font-semibold px-3 sm:px-4 gap-1.5 transition-all flex-shrink-0 whitespace-nowrap"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Post-call feedback screen (takes priority over everything) ── */}
        {showPostCall && !isConnected && !isConnecting && (
          <MotionPostCallFeedback
            key="post-call-feedback"
            {...VIEW_MOTION_PROPS}
            onDone={handleFeedbackDone}
          />
        )}

        {/* ── Welcome / Voice Assistant view ── */}
        {!showPostCall && !isConnected && !isConnecting && activeTab === 'assistant' && (
          <MotionWelcomeView
            key="welcome"
            {...VIEW_MOTION_PROPS}
            startButtonText={appConfig.startButtonText}
            onStartCall={handleStartCall}
            micError={micError}
          />
        )}

        {/* ── Call Analytics Dashboard ── */}
        {!showPostCall && !isConnected && !isConnecting && activeTab === 'dashboard' && (
          <MotionDashboardView key="dashboard" {...VIEW_MOTION_PROPS} />
        )}

        {/* ── Complaint Helpline ── */}
        {!showPostCall && !isConnected && !isConnecting && activeTab === 'helpline' && (
          <MotionComplaintHelpline key="helpline" {...VIEW_MOTION_PROPS} />
        )}

        {/* ── Open Escalations ── */}
        {!showPostCall && !isConnected && !isConnecting && activeTab === 'escalations' && (
          <MotionOpenEscalations key="escalations" {...VIEW_MOTION_PROPS} />
        )}

        {/* ── Fraud Prevention ── */}
        {!showPostCall && !isConnected && !isConnecting && activeTab === 'fraud' && (
          <MotionFraudPrevention key="fraud" {...VIEW_MOTION_PROPS} />
        )}

        {/* ── Schemes Search ── */}
        {!showPostCall && !isConnected && !isConnecting && activeTab === 'schemes' && (
          <MotionSchemesSearch key="schemes" {...VIEW_MOTION_PROPS} />
        )}

        {/* ── Connecting overlay ── */}
        {isConnecting && !isConnected && (
          <motion.div
            key="connecting"
            {...VIEW_MOTION_PROPS}
            className="flex min-h-screen w-full flex-col items-center justify-center px-4"
          >
            <div className="bg-card/80 backdrop-blur-md border border-border flex w-full max-w-sm flex-col items-center justify-center rounded-3xl p-10 text-center shadow-2xl gap-5">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Loader2Icon className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Connecting…</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  The agent is joining the call, please wait
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    style={{
                      animation: 'bounce-dot 1.2s infinite ease-in-out',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Live session view ── */}
        {isConnected && (
          <MotionSessionView
            key="session-view"
            {...VIEW_MOTION_PROPS}
            supportsChatInput={appConfig.supportsChatInput}
            supportsVideoInput={appConfig.supportsVideoInput}
            supportsScreenShare={appConfig.supportsScreenShare}
            isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
            audioVisualizerType={appConfig.audioVisualizerType}
            audioVisualizerColor={
              resolvedTheme === 'dark'
                ? appConfig.audioVisualizerColorDark
                : appConfig.audioVisualizerColor
            }
            audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
            audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
            audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
            audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
            audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
            audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
            audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
            className="fixed inset-0"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
