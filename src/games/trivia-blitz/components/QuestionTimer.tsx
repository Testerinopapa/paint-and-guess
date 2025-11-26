import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface QuestionTimerProps {
  timeLimit: number;
}

export default function QuestionTimer({ timeLimit }: QuestionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit]);

  const progress = (timeLeft / timeLimit) * 100;

  return (
    <div className="w-32">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold">{timeLeft}s</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

