import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

interface GameImageGalleryProps {
  screenshots: string[];
  gameName: string;
}

export const GameImageGallery = ({ screenshots, gameName }: GameImageGalleryProps) => {
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  }, [screenshots.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  }, [screenshots.length]);

  // Swipe gesture handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext]);

  const validScreenshots = screenshots.filter((_, index) => !imageErrors.has(index));

  if (validScreenshots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Main Image Display */}
      <div
        ref={galleryRef}
        className="relative aspect-video overflow-hidden rounded-lg border bg-muted touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!imageErrors.has(selectedIndex) ? (
          <>
            <img 
              src={screenshots[selectedIndex]} 
              alt={`${gameName} screenshot ${selectedIndex + 1}`}
              className="w-full h-full object-cover select-none"
              loading={selectedIndex === 0 ? "eager" : "lazy"}
              onError={() => handleImageError(selectedIndex)}
              draggable={false}
            />
            {screenshots.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "icon"}
                  className={cn(
                    "absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background backdrop-blur-sm",
                    isMobile ? "h-10 w-10" : ""
                  )}
                  onClick={handlePrevious}
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                </Button>
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "icon"}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background backdrop-blur-sm",
                    isMobile ? "h-10 w-10" : ""
                  )}
                  onClick={handleNext}
                  aria-label="Next screenshot"
                >
                  <ChevronRight className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                </Button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm md:text-base">Image unavailable</p>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {screenshots.length > 1 && (
        <div className={cn(
          "grid gap-2",
          isMobile ? "grid-cols-3" : "grid-cols-4"
        )}>
          {screenshots.map((screenshot, index) => {
            if (imageErrors.has(index)) return null;
            
            return (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative aspect-video overflow-hidden rounded border-2 transition-all",
                  "active:scale-95",
                  index === selectedIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/50 active:border-muted-foreground/70"
                )}
                aria-label={`View screenshot ${index + 1}`}
              >
                <img 
                  src={screenshot} 
                  alt={`${gameName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover select-none"
                  loading="lazy"
                  onError={() => handleImageError(index)}
                  draggable={false}
                />
                {index === selectedIndex && (
                  <div className="absolute inset-0 bg-primary/10" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Screenshot Counter */}
      {screenshots.length > 1 && (
        <p className="text-xs md:text-sm text-muted-foreground text-center">
          {selectedIndex + 1} of {validScreenshots.length}
        </p>
      )}
    </div>
  );
};

