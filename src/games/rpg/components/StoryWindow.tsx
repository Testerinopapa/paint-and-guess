import { MapPin, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { TypingText } from "./TypingText";

// Debug configuration
const DEBUG_STORY = import.meta.env.DEV || import.meta.env.VITE_DEBUG_RPG === "true" || import.meta.env.VITE_DEBUG_STORY === "true";
const DEBUG_LOG_PREFIX = "[StoryWindow]";

// Debug logging utilities
function debugLog(level: "info" | "warn" | "error" | "action", message: string, data?: unknown) {
  if (!DEBUG_STORY) return;

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

interface StoryWindowProps {
  location: string;
  storyText: string[];
}

interface StoryEntry {
  id: number;
  text: string;
  isCommand: boolean;
  timestamp: number;
  isTyping: boolean;
}

export const StoryWindow = ({ location, storyText }: StoryWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [storyEntries, setStoryEntries] = useState<StoryEntry[]>([]);
  const [enableTyping, setEnableTyping] = useState(true);
  const previousLengthRef = useRef(0);
  const entryIdRef = useRef(0);

  // Debug: Log component mount
  useEffect(() => {
    debugLog("info", "StoryWindow mounted", {
      location,
      initialStoryLength: storyText.length,
      enableTyping,
    });
  }, []);

  // Convert storyText array to StoryEntry objects with typing state
  useEffect(() => {
    const currentLength = storyText.length;
    const previousLength = previousLengthRef.current;
    const hasNewEntries = currentLength > previousLength;
    
    debugLog("action", "Processing story text", {
      currentLength,
      previousLength,
      hasNewEntries,
      enableTyping,
      newLines: hasNewEntries ? storyText.slice(previousLength) : [],
    });
    
    const newEntries: StoryEntry[] = [];
    const baseTimestamp = Date.now();

    storyText.forEach((line, index) => {
      // Handle empty lines
      if (!line.trim()) {
        newEntries.push({
          id: entryIdRef.current++,
          text: "",
          isCommand: false,
          timestamp: baseTimestamp + index,
          isTyping: false,
        });
        return;
      }

      const isCommand = line.startsWith("> ");
      const text = isCommand ? line.substring(2) : line;

      // Determine if this is a new entry (only entries after previous length should be new)
      const isNewEntry = index >= previousLength;
      const willType = enableTyping && isNewEntry && index === currentLength - 1 && hasNewEntries;
      
      const entry: StoryEntry = {
        id: entryIdRef.current++,
        text,
        isCommand,
        timestamp: baseTimestamp + index,
        isTyping: willType,
      };

      if (isNewEntry) {
        debugLog("info", `New entry created [${entry.id}]`, {
          text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
          isCommand,
          willType,
          index,
        });
      }

      newEntries.push(entry);
    });

    previousLengthRef.current = currentLength;
    
    debugLog("action", "Story entries updated", {
      totalEntries: newEntries.length,
      typingEntries: newEntries.filter((e) => e.isTyping).length,
      commandEntries: newEntries.filter((e) => e.isCommand).length,
      narrativeEntries: newEntries.filter((e) => !e.isCommand && e.text).length,
    });

    setStoryEntries(newEntries);
  }, [storyText, enableTyping]);

  useEffect(() => {
    if (scrollRef.current) {
      const beforeScroll = scrollRef.current.scrollTop;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      const afterScroll = scrollRef.current.scrollTop;
      
      debugLog("info", "Auto-scrolled story window", {
        beforeScroll,
        afterScroll,
        scrollHeight: scrollRef.current.scrollHeight,
        clientHeight: scrollRef.current.clientHeight,
      });
    }
  }, [storyEntries]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="flex flex-col min-h-[400px] max-h-[600px]">
      <div className="flex items-center justify-between p-4 bg-secondary/30 border-b-2 border-primary/30 rounded-t-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            {location}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent/70" />
          <span className="text-xs font-mono text-accent/70">TERMINAL</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-6 bg-gradient-to-br from-amber-50/10 to-stone-50/10 rounded-b-lg border-2 border-primary/30 overflow-y-auto min-h-0 custom-scrollbar terminal-window"
      >
        <div className="space-y-3 font-mono text-foreground/90 leading-relaxed">
          <AnimatePresence>
            {storyEntries.map((entry) => {
              if (!entry.text) {
                return <br key={entry.id} />;
              }

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`story-entry ${entry.isCommand ? "command-entry" : "narrative-entry"}`}
                >
                  <div className="flex items-start gap-2">
                    {entry.isCommand && (
                      <motion.span
                        className="text-accent/70 font-bold flex-shrink-0 mt-1"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        &gt;
                      </motion.span>
                    )}
                    <div className="flex-1 prose prose-invert prose-sm max-w-none">
                      {entry.isTyping && enableTyping ? (
                        <motion.div
                          className="text-foreground/95"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <TypingText
                            text={entry.text}
                            speed={30}
                            showCursor={true}
                            onComplete={() => {
                              debugLog("action", `Typing completed for entry [${entry.id}]`, {
                                entryId: entry.id,
                                textLength: entry.text.length,
                                isCommand: entry.isCommand,
                              });
                              setStoryEntries((prev) =>
                                prev.map((e) => (e.id === entry.id ? { ...e, isTyping: false } : e))
                              );
                            }}
                          />
                        </motion.div>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          onError={(error) => {
                            debugLog("error", "Markdown rendering error", {
                              entryId: entry.id,
                              text: entry.text,
                              error: error.message || error,
                            });
                          }}
                          components={{
                            p: ({ children }) => (
                              <p className="m-0 text-foreground/95">{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong className="text-primary font-bold">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="text-accent italic">{children}</em>
                            ),
                            code: ({ children }) => (
                              <code className="bg-secondary/30 px-1.5 py-0.5 rounded text-accent font-mono text-sm">
                                {children}
                              </code>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-foreground/90">{children}</li>
                            ),
                          }}
                        >
                          {entry.text}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Debug utilities exposed to window object for console access
if (typeof window !== "undefined" && DEBUG_STORY) {
  // Store reference to StoryWindow debug functions
  (window as any).__STORY_DEBUG__ = {
    // Get current story entries (requires access to component state)
    logConfig: () => {
      console.log(
        `%c[StoryWindow Debug]%c
Configuration:
  DEBUG_STORY: ${DEBUG_STORY}
  Enable Typing: Check component state
  Location: Check component props
  
Available utilities:
  __STORY_DEBUG__.logConfig()     - Show this help
  __STORY_DEBUG__.checkMarkdown()  - Test markdown rendering
  __STORY_DEBUG__.testTyping()    - Test typing effect speed`,
        "color: #45b355; font-weight: bold;",
        "color: #999; font-size: 12px;"
      );
    },

    // Test markdown rendering
    checkMarkdown: (text: string) => {
      const testText = text || "**Bold** *italic* `code` test";
      console.log("[StoryWindow Debug] Testing markdown:", testText);
      console.log("[StoryWindow Debug] Raw:", testText);
      console.log("[StoryWindow Debug] Should render:", {
        bold: testText.includes("**"),
        italic: testText.includes("*"),
        code: testText.includes("`"),
      });
    },

    // Test typing speed calculation
    testTyping: (text: string, speed: number = 30) => {
      const testText = text || "This is a test message for typing effect.";
      const duration = testText.length * speed;
      console.log("[StoryWindow Debug] Typing test:", {
        text: testText,
        length: testText.length,
        speed: `${speed}ms per character`,
        estimatedDuration: `${duration}ms (${(duration / 1000).toFixed(2)}s)`,
      });
    },

    // Help message
    help: () => {
      console.log(
        `%c[StoryWindow Debug Utilities]%c
Available commands:
  __STORY_DEBUG__.logConfig()           - Show debug configuration
  __STORY_DEBUG__.checkMarkdown(text)    - Test markdown rendering
  __STORY_DEBUG__.testTyping(text, speed) - Test typing effect
  __STORY_DEBUG__.help()                 - Show this help message

Example:
  __STORY_DEBUG__.checkMarkdown("**Bold** text")
  __STORY_DEBUG__.testTyping("Hello world", 50)`,
        "color: #45b355; font-weight: bold; font-size: 14px;",
        "color: #999; font-size: 12px;"
      );
    },
  };

  console.log(
    "%c[StoryWindow Debug]%c Debug utilities loaded. Type __STORY_DEBUG__.help() for available commands.",
    "color: #45b355; font-weight: bold;",
    "color: #999;"
  );
}

