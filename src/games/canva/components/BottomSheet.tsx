import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  children: React.ReactNode;
  defaultHeight?: number;
  maxHeight?: number;
  minHeight?: number;
  className?: string;
  disabled?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export function BottomSheet({
  children,
  defaultHeight = 56,
  maxHeight = 200,
  minHeight = 56,
  className,
  disabled = false,
  onToggle,
}: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState(defaultHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const currentHeight = expanded ? maxHeight : minHeight;

  useEffect(() => {
    setHeight(currentHeight);
  }, [expanded, currentHeight]);

  useEffect(() => {
    if (onToggle) {
      onToggle(expanded);
    }
  }, [expanded, onToggle]);

  const handleToggle = () => {
    if (disabled) return;
    setExpanded(!expanded);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(height);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const deltaY = startY - e.touches[0].clientY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
    setHeight(newHeight);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap to nearest state
    const threshold = (maxHeight + minHeight) / 2;
    setExpanded(height > threshold);
    setHeight(height > threshold ? maxHeight : minHeight);
  };

  return (
    <div
      ref={sheetRef}
      className={cn(
        "bg-card border-t transition-all duration-300 ease-in-out overflow-hidden",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      style={{ height: `${height}px` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}

interface BottomSheetHeaderProps {
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  className?: string;
}

export function BottomSheetHeader({
  children,
  expanded,
  onToggle,
  className,
}: BottomSheetHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 flex-shrink-0 cursor-pointer select-none",
        className
      )}
      onClick={onToggle}
    >
      {children}
      {expanded ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  );
}

interface BottomSheetContentProps {
  children: React.ReactNode;
  className?: string;
}

export function BottomSheetContent({ children, className }: BottomSheetContentProps) {
  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      {children}
    </div>
  );
}

