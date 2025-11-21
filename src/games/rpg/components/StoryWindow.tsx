import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

interface StoryWindowProps {
  location: string;
  storyText: string[];
}

export const StoryWindow = ({ location, storyText }: StoryWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [storyText]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 bg-secondary/30 border-b-2 border-primary/30 rounded-t-lg">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
          {location}
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-6 bg-gradient-to-br from-amber-50/5 to-stone-50/5 rounded-b-lg border-2 border-primary/30 overflow-y-auto"
      >
        <div className="space-y-4 font-mono text-foreground/90 leading-relaxed">
          {storyText.map((line, index) => (
            <p key={index} className="animate-fade-in">
              {line || <br />}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

