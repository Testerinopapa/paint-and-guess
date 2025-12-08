export interface Guess {
  word: string;
  rank: number;
  timestamp: number;
}

export interface GameState {
  targetWord: string;
  guesses: Guess[];
  isComplete: boolean;
  won: boolean;
  hintsUsed: number;
}

// Simplified similarity database (used only for hot/cold clues)
const wordDatabase: Record<string, { similar: string[]; rank: number }[]> = {
  ocean: [
    { similar: ['sea', 'water', 'wave', 'beach', 'tide', 'marine', 'aquatic', 'coast', 'shore', 'deep'], rank: 2 },
    { similar: ['lake', 'river', 'pond', 'stream', 'bay', 'gulf', 'inlet', 'harbor', 'lagoon'], rank: 5 },
    { similar: ['blue', 'wet', 'salt', 'fish', 'whale', 'dolphin', 'coral', 'reef', 'island'], rank: 20 },
    { similar: ['vast', 'liquid', 'surface', 'depth', 'horizon', 'current'], rank: 50 },
  ],
  mountain: [
    { similar: ['peak', 'summit', 'hill', 'cliff', 'slope', 'alpine', 'elevation', 'ridge', 'volcano'], rank: 2 },
    { similar: ['rock', 'stone', 'high', 'tall', 'climb', 'steep', 'range', 'valley'], rank: 5 },
    { similar: ['snow', 'ice', 'cold', 'nature', 'landscape', 'terrain', 'wilderness'], rank: 20 },
  ],
  forest: [
    { similar: ['tree', 'woods', 'woodland', 'jungle', 'grove', 'timber', 'pine', 'oak'], rank: 2 },
    { similar: ['green', 'leaf', 'branch', 'trunk', 'nature', 'wild', 'vegetation'], rank: 5 },
    { similar: ['park', 'garden', 'plant', 'grass', 'bush', 'shrub', 'fauna'], rank: 20 },
  ],
  sunset: [
    { similar: ['dusk', 'twilight', 'evening', 'dawn', 'sunrise', 'horizon', 'sky'], rank: 2 },
    { similar: ['orange', 'red', 'pink', 'golden', 'light', 'glow', 'color'], rank: 5 },
    { similar: ['beautiful', 'romantic', 'peaceful', 'calm', 'serene', 'view'], rank: 20 },
  ],
  music: [
    { similar: ['song', 'melody', 'rhythm', 'tune', 'sound', 'beat', 'harmony', 'notes'], rank: 2 },
    { similar: ['instrument', 'piano', 'guitar', 'drums', 'violin', 'orchestra'], rank: 5 },
    { similar: ['concert', 'band', 'artist', 'singer', 'composer', 'album'], rank: 20 },
  ],
};

const targetWords = Object.keys(wordDatabase);

export function getRandomTargetWord(): string {
  return targetWords[Math.floor(Math.random() * targetWords.length)];
}

export function getDailyTargetWord(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return targetWords[dayOfYear % targetWords.length];
}

export function calculateSimilarity(guess: string, target: string): number {
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();

  // Perfect match
  if (normalizedGuess === normalizedTarget) {
    return 1;
  }

  // Check database for similarity
  const targetData = wordDatabase[normalizedTarget];
  if (targetData) {
    for (const group of targetData) {
      if (group.similar.includes(normalizedGuess)) {
        return group.rank;
      }
    }
  }

  // Random rank for unknown words (between 100-1000)
  return Math.floor(Math.random() * 900) + 100;
}

export function getSimilarityColor(rank: number): string {
  if (rank === 1) return 'perfect';
  if (rank <= 10) return 'excellent';
  if (rank <= 50) return 'great';
  if (rank <= 100) return 'good';
  return 'cold';
}

export function getSimilarityPercentage(rank: number): number {
  if (rank === 1) return 100;
  if (rank <= 10) return 90 - (rank - 2) * 5;
  if (rank <= 50) return 50 - (rank - 11) * 0.5;
  if (rank <= 100) return 30 - (rank - 51) * 0.2;
  return Math.max(5, 20 - (rank - 101) * 0.02);
}

export function getHint(target: string, hintsUsed: number): string {
  const hints = [
    `The word has ${target.length} letters`,
    `It starts with "${target[0].toUpperCase()}"`,
    `It ends with "${target[target.length - 1]}"`,
  ];
  return hints[Math.min(hintsUsed, hints.length - 1)];
}

export function createInitialGameState(): GameState {
  return {
    targetWord: getDailyTargetWord(),
    guesses: [],
    isComplete: false,
    won: false,
    hintsUsed: 0,
  };
}

