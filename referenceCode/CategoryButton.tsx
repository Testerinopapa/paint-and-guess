import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const CategoryButton = ({ icon: Icon, label, isActive, onClick }: CategoryButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
        "hover:bg-[var(--category-hover)] active:scale-95",
        isActive && "bg-[var(--category-active)] shadow-soft"
      )}
      aria-label={label}
      aria-pressed={isActive}
    >
      <Icon className={cn(
        "w-6 h-6 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )} />
      <span className={cn(
        "text-sm font-medium transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </button>
  );
};
