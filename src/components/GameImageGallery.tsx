import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameImageGalleryProps {
  screenshots: string[];
  gameName: string;
}

export const GameImageGallery = ({ screenshots, gameName }: GameImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const validScreenshots = screenshots.filter((_, index) => !imageErrors.has(index));

  if (validScreenshots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
        {!imageErrors.has(selectedIndex) ? (
          <>
            <img 
              src={screenshots[selectedIndex]} 
              alt={`${gameName} screenshot ${selectedIndex + 1}`}
              className="w-full h-full object-cover"
              loading={selectedIndex === 0 ? "eager" : "lazy"}
              onError={() => handleImageError(selectedIndex)}
            />
            {screenshots.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background backdrop-blur-sm"
                  onClick={handlePrevious}
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background backdrop-blur-sm"
                  onClick={handleNext}
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">Image unavailable</p>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {screenshots.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {screenshots.map((screenshot, index) => {
            if (imageErrors.has(index)) return null;
            
            return (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative aspect-video overflow-hidden rounded border-2 transition-all",
                  index === selectedIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
                aria-label={`View screenshot ${index + 1}`}
              >
                <img 
                  src={screenshot} 
                  alt={`${gameName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => handleImageError(index)}
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
        <p className="text-sm text-muted-foreground text-center">
          {selectedIndex + 1} of {validScreenshots.length}
        </p>
      )}
    </div>
  );
};

