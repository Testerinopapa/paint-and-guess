import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AnswerButtonProps {
  option: { id: string; text: string; color: string };
  onClick: () => void;
  disabled?: boolean;
}

export default function AnswerButton({ option, onClick, disabled }: AnswerButtonProps) {
  return (
    <Card className="overflow-hidden">
      <Button
        onClick={onClick}
        disabled={disabled}
        className="w-full h-24 p-4 flex flex-col items-center justify-center gap-2"
        style={{
          backgroundColor: disabled ? undefined : option.color,
          color: disabled ? undefined : "white",
        }}
        variant={disabled ? "outline" : "default"}
      >
        <div
          className="w-12 h-12 rounded-full border-2 border-white"
          style={{ backgroundColor: option.color }}
        />
        <span className="font-semibold text-lg">{option.text}</span>
      </Button>
    </Card>
  );
}

