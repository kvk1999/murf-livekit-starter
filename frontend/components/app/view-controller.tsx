'use client';

import { useEffect, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { ConnectionState } from 'livekit-client';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start, connectionState } = useSessionContext();
  const isConnecting = connectionState === ConnectionState.Connecting;
  const { resolvedTheme } = useTheme();
  const [micError, setMicError] = useState<string | null>(null);

  // Detect mic permission errors proactively on the welcome screen
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
    // Try to get mic access before connecting; catch permission errors
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicError(null);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setMicError(
          'Microphone access was denied. Please allow microphone access in your browser to use the voice agent.'
        );
        return; // Don't connect without mic
      }
      // Other errors (no device, etc.) – still proceed; agent can handle
    }
    start();
  };

  return (
    <AnimatePresence mode="wait">
      {/* Welcome view */}
      {!isConnected && !isConnecting && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={handleStartCall}
          micError={micError}
        />
      )}

      {/* Connecting overlay */}
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

      {/* Session view */}
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
  );
}

