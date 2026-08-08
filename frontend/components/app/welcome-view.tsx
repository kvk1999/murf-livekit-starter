import { ShieldCheckIcon, MicOffIcon, SparklesIcon, PhoneCallIcon, BotIcon, LockIcon, ZapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function AgentAvatar() {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      {/* Dynamic ambient glowing aura */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-40 animate-pulse" />
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-card to-background border-2 border-primary/40 shadow-2xl transition-all duration-300 group-hover:scale-105">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <BotIcon className="h-10 w-10 text-primary animate-bounce-slow" />
        </div>
      </div>
    </div>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  micError?: string | null;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  micError,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-b from-background via-background/95 to-accent/20">
      {/* Background visual accents */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl" />

      <section className="relative z-10 bg-card/75 backdrop-blur-xl border border-border/80 flex w-full max-w-lg flex-col items-center justify-center rounded-3xl p-8 sm:p-10 text-center shadow-2xl ring-1 ring-white/10 transition-all duration-300">
        <AgentAvatar />

        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold text-primary shadow-sm">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
          Kathirvelan Karthik (கதிர்வேலன் கார்த்திக்)
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
          Digital Financial Assistant
        </h1>

        <p className="text-muted-foreground mt-3 max-w-md text-sm sm:text-base leading-relaxed">
          Friendly guidance on government schemes, digital banking safety, and financial literacy.
        </p>

        {/* Feature highlight pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-accent/60 px-2.5 py-1 text-[11px] font-medium text-foreground/80">
            <ZapIcon className="h-3 w-3 text-amber-500" /> Instant Voice AI
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-accent/60 px-2.5 py-1 text-[11px] font-medium text-foreground/80">
            <ShieldCheckIcon className="h-3 w-3 text-emerald-500" /> Scheme Guidance
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-accent/60 px-2.5 py-1 text-[11px] font-medium text-foreground/80">
            <LockIcon className="h-3 w-3 text-indigo-500" /> Safe & Private
          </span>
        </div>

        {/* Microphone Permission Error Handler */}
        {micError && (
          <Alert variant="destructive" className="mt-6 text-left border-destructive/50 bg-destructive/10 backdrop-blur-md rounded-2xl">
            <MicOffIcon className="h-4 w-4" />
            <AlertTitle className="font-semibold">Microphone Access Blocked</AlertTitle>
            <AlertDescription className="text-xs mt-1 leading-relaxed">
              {micError}
              <div className="mt-2 font-medium">
                To fix: Click the lock/tune icon in your browser address bar and set Microphone permission to <strong>Allow</strong>, then refresh this page.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button
          size="lg"
          onClick={onStartCall}
          className="mt-8 h-12 w-full max-w-xs rounded-full bg-primary text-primary-foreground font-bold tracking-wide shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95 text-sm"
        >
          <PhoneCallIcon className="mr-2 h-4 w-4" />
          {startButtonText}
        </Button>
      </section>

      <footer className="relative z-10 mt-8 text-center text-xs text-muted-foreground flex items-center gap-2">
        <span>Powered by Murf AI & LiveKit</span>
        <span>•</span>
        <span>Tamil Nadu Financial Assistant</span>
      </footer>
    </div>
  );
};
