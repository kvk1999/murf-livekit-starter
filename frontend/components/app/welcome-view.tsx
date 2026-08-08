import { ShieldCheckIcon, MicOffIcon, SparklesIcon, PhoneCallIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function AgentAvatar() {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-lg opacity-75 animate-pulse" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-card border-2 border-primary/30 shadow-xl">
        <SparklesIcon className="h-12 w-12 text-primary" />
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
    <div ref={ref} className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8">
      <section className="bg-card/80 backdrop-blur-md border border-border flex w-full max-w-lg flex-col items-center justify-center rounded-3xl p-8 text-center shadow-2xl transition-all">
        <AgentAvatar />

        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
          Kathirvelan Karthik (கதிர்வேலன் கார்த்திக்)
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Digital Financial Assistant
        </h1>

        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
          Friendly guidance on government schemes, digital banking safety, and financial literacy.
        </p>

        {/* Microphone Permission Error Handler */}
        {micError && (
          <Alert variant="destructive" className="mt-6 text-left border-destructive/50 bg-destructive/10">
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
          className="mt-8 w-full max-w-xs rounded-full bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <PhoneCallIcon className="mr-2 h-4 w-4" />
          {startButtonText}
        </Button>
      </section>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        Powered by AI Voice Technology • Confidential & Secure
      </footer>
    </div>
  );
};
