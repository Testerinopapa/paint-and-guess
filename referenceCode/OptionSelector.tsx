import { cn } from "@/lib/utils";

interface OptionSelectorProps {
  options: Array<{ value: string; label: string }>;
  selectedOption: string;
  onOptionChange: (value: string) => void;
  label: string;
}

export const OptionSelector = ({ options, selectedOption, onOptionChange, label }: OptionSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onOptionChange(option.value)}
            className={cn(
              "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              "border-2 hover:scale-105 active:scale-95",
              selectedOption === option.value
                ? "bg-primary text-primary-foreground border-primary shadow-soft"
                : "bg-card text-card-foreground border-border hover:border-primary/50"
            )}
            aria-pressed={selectedOption === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
