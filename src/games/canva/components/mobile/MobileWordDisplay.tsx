interface MobileWordDisplayProps {
  word: string;
}

export function MobileWordDisplay({ word }: MobileWordDisplayProps) {
  return (
    <div className="fixed top-28 left-0 right-0 h-18 bg-primary text-primary-foreground z-30 px-4 py-3">
      <p className="text-xs opacity-90 mb-1 text-center">Your word:</p>
      <p className="text-2xl font-bold text-center">{word}</p>
    </div>
  );
}

