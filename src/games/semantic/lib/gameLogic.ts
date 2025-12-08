// Semantic Game Logic - Word similarity guessing game
export interface Guess {
  word: string;
  rank: number;
  similarity: number;
}

export interface GameState {
  targetWord: string;
  guesses: Guess[];
  isComplete: boolean;
  gaveUp: boolean;
  hintsUsed: number;
}

// Word similarity database with ranked similar words
const wordDatabase: Record<string, { similar: string[]; rank: number }[]> = {
  ocean: [
    { similar: ['sea', 'water', 'wave', 'beach', 'tide', 'marine', 'aquatic', 'coast', 'shore', 'deep'], rank: 1 },
    { similar: ['blue', 'vast', 'pacific', 'atlantic', 'fish', 'whale', 'coral', 'surf'], rank: 2 },
    { similar: ['nature', 'earth', 'planet', 'life', 'swim', 'dive', 'boat', 'ship'], rank: 3 },
  ],
  mountain: [
    { similar: ['peak', 'hill', 'summit', 'climb', 'alpine', 'everest', 'rocky', 'high', 'tall', 'range'], rank: 1 },
    { similar: ['snow', 'hiking', 'nature', 'valley', 'cliff', 'steep', 'terrain'], rank: 2 },
    { similar: ['adventure', 'outdoor', 'landscape', 'view', 'cold', 'rock', 'stone'], rank: 3 },
  ],
  forest: [
    { similar: ['tree', 'woods', 'jungle', 'woodland', 'timber', 'grove', 'trees', 'green', 'nature'], rank: 1 },
    { similar: ['wildlife', 'hiking', 'camping', 'leaves', 'branch', 'pine', 'oak'], rank: 2 },
    { similar: ['outdoor', 'adventure', 'peace', 'quiet', 'animal', 'bird', 'path'], rank: 3 },
  ],
  thunder: [
    { similar: ['lightning', 'storm', 'rain', 'weather', 'bolt', 'electric', 'flash', 'cloud'], rank: 1 },
    { similar: ['loud', 'noise', 'sound', 'rumble', 'boom', 'crash', 'roar'], rank: 2 },
    { similar: ['dark', 'sky', 'power', 'nature', 'force', 'energy'], rank: 3 },
  ],
  sunset: [
    { similar: ['sunrise', 'dusk', 'evening', 'twilight', 'horizon', 'sky', 'golden', 'orange'], rank: 1 },
    { similar: ['beautiful', 'romantic', 'view', 'beach', 'cloud', 'color', 'red'], rank: 2 },
    { similar: ['nature', 'peaceful', 'calm', 'photo', 'moment', 'end', 'day'], rank: 3 },
  ],
};

// Get daily word based on date
export function getDailyWord(): string {
  const words = Object.keys(wordDatabase);
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return words[dayOfYear % words.length];
}

// Calculate similarity rank for a guess
export function getSimilarityRank(targetWord: string, guess: string): number {
  const lowerGuess = guess.toLowerCase().trim();
  const lowerTarget = targetWord.toLowerCase();

  if (lowerGuess === lowerTarget) return 1;

  const wordData = wordDatabase[lowerTarget];
  if (!wordData) return 9999;

  for (const group of wordData) {
    if (group.similar.includes(lowerGuess)) {
      return group.rank;
    }
  }

  return 9999; // Unknown word
}

// Check if guess is exact match
export function isExactMatch(targetWord: string, guess: string): boolean {
  return guess.toLowerCase().trim() === targetWord.toLowerCase();
}

// Get hint word based on hints used
export function getHint(targetWord: string, hintsUsed: number): string | null {
  const wordData = wordDatabase[targetWord.toLowerCase()];
  if (!wordData) return null;

  const allHints = wordData.flatMap(group => group.similar);
  if (hintsUsed >= allHints.length) return null;

  return allHints[hintsUsed];
}

// Get similarity color based on rank
export function getSimilarityColor(rank: number): string {
  if (rank === 1) return 'text-green-500';
  if (rank === 2) return 'text-yellow-500';
  if (rank === 3) return 'text-orange-500';
  return 'text-muted-foreground';
}

// Get similarity percentage for display
export function getSimilarityPercentage(rank: number): number {
  if (rank === 1) return 100;
  if (rank === 2) return 75;
  if (rank === 3) return 50;
  if (rank < 100) return 25;
  return 0;
}

// Local storage helpers
const STORAGE_KEY = 'semantic-game-state';

export function saveGameState(state: GameState): void {
  try {
    const today = new Date().toDateString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, state }));
  } catch {
    // Ignore storage errors
  }
}

export function loadGameState(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const { date, state } = JSON.parse(saved);
    const today = new Date().toDateString();

    // Reset if it's a new day
    if (date !== today) return null;

    return state;
  } catch {
    return null;
  }
}

