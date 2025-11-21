import { useEffect, useState, useRef } from "react";

// Debug configuration
const DEBUG_TYPING = import.meta.env.DEV || import.meta.env.VITE_DEBUG_RPG === "true" || import.meta.env.VITE_DEBUG_TYPING === "true";
const DEBUG_LOG_PREFIX = "[TypingText]";

// Debug logging utilities
function debugLog(level: "info" | "warn" | "error" | "action", message: string, data?: unknown) {
  if (!DEBUG_TYPING) return;

  const timestamp = new Date().toISOString();
  const prefix = `${DEBUG_LOG_PREFIX} [${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case "info":
      console.log(prefix, message, data ? data : "");
      break;
    case "warn":
      console.warn(prefix, message, data ? data : "");
      break;
    case "error":
      console.error(prefix, message, data ? data : "");
      break;
    case "action":
      console.groupCollapsed(`${prefix} ${message}`);
      if (data) console.log(data);
      console.groupEnd();
      break;
  }
}

interface TypingTextProps {
  text: string;
  speed?: number;
  showCursor?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const TypingText = ({ 
  text, 
  speed = 30, 
  showCursor = true, 
  onComplete,
  className = "" 
}: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const startTimeRef = useRef<number | null>(null);
  const componentIdRef = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    if (!text) {
      debugLog("info", `[${componentIdRef.current}] Empty text, skipping typing`);
      setDisplayedText("");
      setIsTyping(false);
      onComplete?.();
      return;
    }

    debugLog("action", `[${componentIdRef.current}] Starting typing effect`, {
      textLength: text.length,
      speed,
      estimatedDuration: `${(text.length * speed) / 1000}s`,
      showCursor,
    });

    setDisplayedText("");
    setIsTyping(true);
    startTimeRef.current = performance.now();
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        
        // Log progress every 10 characters
        if (currentIndex % 10 === 0 || currentIndex === text.length) {
          const elapsed = performance.now() - (startTimeRef.current || 0);
          const progress = ((currentIndex / text.length) * 100).toFixed(1);
          debugLog("info", `[${componentIdRef.current}] Typing progress`, {
            progress: `${progress}%`,
            characters: `${currentIndex}/${text.length}`,
            elapsed: `${elapsed.toFixed(0)}ms`,
            estimatedRemaining: `${((text.length - currentIndex) * speed).toFixed(0)}ms`,
          });
        }
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        const totalTime = performance.now() - (startTimeRef.current || 0);
        const expectedTime = text.length * speed;
        const efficiency = ((expectedTime / totalTime) * 100).toFixed(1);
        
        debugLog("action", `[${componentIdRef.current}] Typing completed`, {
          totalTime: `${totalTime.toFixed(0)}ms`,
          expectedTime: `${expectedTime}ms`,
          efficiency: `${efficiency}%`,
          charactersPerSecond: ((text.length / totalTime) * 1000).toFixed(1),
        });
        
        onComplete?.();
      }
    }, speed);

    return () => {
      if (typingInterval) {
        clearInterval(typingInterval);
        debugLog("warn", `[${componentIdRef.current}] Typing interrupted/cleaned up`);
      }
    };
  }, [text, speed, onComplete, showCursor]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && isTyping && (
        <span className="typed-cursor text-primary ml-0.5">▋</span>
      )}
    </span>
  );
};

