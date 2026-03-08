"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useInkwell } from "@/hooks/useInkwell";
import { queueThought, registerBackgroundSync } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CaptureFormProps {
  onSuccess?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
  initialContent?: string;
  showVoiceInput?: boolean;
}

export default function CaptureForm({
  onSuccess,
  autoFocus = true,
  compact = false,
  initialContent = "",
  showVoiceInput = false,
}: CaptureFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCaptured, setShowCaptured] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasSpeech, setHasSpeech] = useState(false);
  const capturedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { createDump } = useInkwell();

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setHasSpeech("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  }, []);

  const flashCaptured = () => {
    setShowCaptured(true);
    if (capturedTimer.current) clearTimeout(capturedTimer.current);
    capturedTimer.current = setTimeout(() => setShowCaptured(false), 1500);
  };

  const startVoice = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript;
      setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      textareaRef.current?.focus();
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, []);

  const submit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    // Clear immediately and flash feedback — don't wait for the network
    setContent("");
    flashCaptured();
    // Re-focus so the keyboard stays up on mobile
    requestAnimationFrame(() => textareaRef.current?.focus());

    // Offline path
    if (!navigator.onLine) {
      try {
        await queueThought({ content: trimmed, tags: [] });
        await registerBackgroundSync();
        onSuccess?.();
      } catch {
        setError("Couldn't save offline.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Online path — try API, fall back to IndexedDB queue so thought is never lost
    try {
      await createDump({ content: trimmed, tags: [] });
      onSuccess?.();
    } catch {
      try {
        await queueThought({ content: trimmed, tags: [] });
        await registerBackgroundSync();
        onSuccess?.();
      } catch {
        setError("Failed to save. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [content, isSubmitting, createDump, onSuccess]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const charCount = content.length;
  const isNearLimit = charCount > 4500;
  const isAtLimit = charCount >= 5000;

  return (
    <div
      className={`bg-card border border-border rounded-2xl shadow-sm overflow-hidden ${
        compact ? "p-4" : "p-6"
      }`}
    >
      {!compact && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-primary text-sm font-medium">✦ New thought</span>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          if (e.target.value.length <= 5000) setContent(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind? Use #tags to categorize..."
        maxLength={5000}
        rows={compact ? 3 : 4}
        enterKeyHint="send"
        className={`resize-none border-0 shadow-none p-0 bg-transparent text-foreground placeholder:text-muted-foreground/60 leading-relaxed focus-visible:ring-0 font-serif ${
          compact ? "text-base" : "text-lg"
        }`}
      />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-3 min-h-[20px]">
          {showCaptured && (
            <span className="text-primary text-xs flex items-center gap-1">
              <span>✦</span> Captured!
            </span>
          )}
          {!showCaptured && error && (
            <span className="text-destructive text-xs">{error}</span>
          )}
          {!showCaptured && !error && content.length > 0 && (
            <span
              className={`text-xs ${isNearLimit ? "text-orange-400" : "text-muted-foreground"}`}
            >
              {isAtLimit ? "Limit reached" : `${charCount}/5000`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showVoiceInput && hasSpeech && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={startVoice}
              disabled={isListening}
              title={isListening ? "Listening…" : "Voice input"}
              className={`rounded-xl ${isListening ? "bg-red-50 text-red-500 animate-pulse hover:bg-red-50" : "text-muted-foreground hover:text-primary"}`}
            >
              {isListening ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </Button>
          )}

          <span className="text-[11px] text-muted-foreground hidden sm:block">
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">↵</kbd>
            {" to capture · "}
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">⇧↵</kbd>
            {" newline"}
          </span>

          <Button
            onClick={submit}
            disabled={!content.trim() || isSubmitting}
            className="rounded-xl active:scale-95 gap-2 bg-primary hover:bg-primary/85 disabled:bg-primary/40 disabled:opacity-100"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <span>✦</span> Capture
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
