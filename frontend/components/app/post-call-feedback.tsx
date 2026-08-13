'use client';

import React, { useState } from 'react';
import {
  StarIcon,
  PhoneOffIcon,
  CheckCircle2Icon,
  HeartHandshakeIcon,
  SparklesIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostCallFeedbackViewProps {
  onDone: () => void;
}

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export const PostCallFeedbackView = ({ ref, onDone }: React.ComponentProps<'div'> & PostCallFeedbackViewProps) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Log the feedback as a successful call outcome record
      await fetch('/api/calls/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: `feedback_${Date.now()}`,
          outcome: 'success',
          reason: `Post-call feedback | Rating: ${STAR_LABELS[rating] || rating}${comment ? ` | Comment: ${comment}` : ''}`,
          turns: 1,
          room_name: 'browser_feedback',
          user_id: 'guest',
        }),
      });
    } catch (e) {
      // Feedback submission failure is non-critical — proceed anyway
      console.warn('Feedback submission failed:', e);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      // Auto-return to welcome after 2.5s
      setTimeout(onDone, 2500);
    }
  };

  const activeRating = hovered || rating;

  return (
    <div
      ref={ref}
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-b from-background via-background/95 to-accent/20"
    >
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <section className="relative z-10 bg-card/80 backdrop-blur-xl border border-border/80 flex w-full max-w-md flex-col items-center rounded-3xl p-8 sm:p-10 text-center shadow-2xl ring-1 ring-white/10 gap-6">

        {submitted ? (
          /* ── Thank-you confirmation ─────────────────────────── */
          <>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
              <CheckCircle2Icon className="w-12 h-12 text-emerald-500" />
              <span className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                Thank you! 🙏
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Your feedback has been recorded. We'll keep improving to serve you better.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Returning to home…
              </p>
            </div>
          </>
        ) : (
          /* ── Feedback form ──────────────────────────────────── */
          <>
            {/* Icon */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
              <PhoneOffIcon className="w-10 h-10 text-primary" />
              <div className="absolute -inset-2 rounded-full bg-primary/5 animate-pulse" />
            </div>

            {/* Heading */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 mb-3">
                <HeartHandshakeIcon className="w-3.5 h-3.5" />
                Call Ended
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Thank you for calling!
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                How was your experience with Namma Kadai Assistant today?
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-all duration-150 hover:scale-125 active:scale-95"
                    aria-label={`Rate ${star} stars`}
                  >
                    <StarIcon
                      className={`w-9 h-9 transition-colors duration-150 ${
                        star <= activeRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {activeRating > 0 && (
                <span className="text-sm font-semibold text-amber-500 transition-all">
                  {STAR_LABELS[activeRating]}
                </span>
              )}
            </div>

            {/* Comment */}
            <textarea
              placeholder="Any comments or suggestions? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground resize-none"
            />

            {/* Actions */}
            <div className="flex flex-col gap-2.5 w-full">
              <Button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                {submitting ? 'Submitting…' : 'Submit Feedback'}
              </Button>
              <button
                onClick={onDone}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Skip and return to home
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
