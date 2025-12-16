// Game logic and word similarity data
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

// Simplified word similarity database (in production, use word2vec or similar)
const wordDatabase: Record<string, { similar: string[]; rank: number }[]> = {
  ocean: [
    { similar: ['sea', 'water', 'wave', 'beach', 'tide', 'marine', 'aquatic', 'coast', 'shore', 'deep'], rank: 1 },
    { similar: ['lake', 'river', 'pond', 'stream', 'bay', 'gulf', 'inlet', 'harbor', 'lagoon'], rank: 2 },
    { similar: ['blue', 'wet', 'salt', 'fish', 'whale', 'dolphin', 'coral', 'reef', 'island'], rank: 3 },
    { similar: ['vast', 'liquid', 'surface', 'depth', 'horizon', 'current', 'wave'], rank: 4 },
  ],
  mountain: [
    { similar: ['peak', 'summit', 'hill', 'cliff', 'slope', 'alpine', 'elevation', 'ridge', 'volcano'], rank: 1 },
    { similar: ['rock', 'stone', 'high', 'tall', 'climb', 'steep', 'range', 'valley'], rank: 2 },
    { similar: ['snow', 'ice', 'cold', 'nature', 'landscape', 'terrain', 'wilderness'], rank: 3 },
  ],
  forest: [
    { similar: ['tree', 'woods', 'woodland', 'jungle', 'grove', 'timber', 'pine', 'oak'], rank: 1 },
    { similar: ['green', 'leaf', 'branch', 'trunk', 'nature', 'wild', 'vegetation'], rank: 2 },
    { similar: ['park', 'garden', 'plant', 'grass', 'bush', 'shrub', 'fauna'], rank: 3 },
  ],
  sunset: [
    { similar: ['dusk', 'twilight', 'evening', 'dawn', 'sunrise', 'horizon', 'sky'], rank: 1 },
    { similar: ['orange', 'red', 'pink', 'golden', 'light', 'glow', 'color'], rank: 2 },
    { similar: ['beautiful', 'romantic', 'peaceful', 'calm', 'serene', 'view'], rank: 3 },
  ],
  thunder: [
    { similar: ['lightning', 'storm', 'rain', 'weather', 'clouds', 'bolt', 'flash'], rank: 1 },
    { similar: ['loud', 'noise', 'sound', 'rumble', 'boom', 'crash', 'roar'], rank: 2 },
    { similar: ['dark', 'sky', 'power', 'nature', 'force', 'energy'], rank: 3 },
  ],
};

// Get daily word based on date
export function getDailyWord(): string {
  const words = Object.keys(wordDatabase);
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return words[dayOfYear % words.length];
}

// Get similarity rank for a guess
export function getSimilarityRank(targetWord: string, guess: string): number {
  const lowerGuess = guess.toLowerCase().trim();
  const lowerTarget = targetWord.toLowerCase();
  
  if (lowerGuess === lowerTarget) return 1;
  
  const wordData = wordDatabase[lowerTarget];
  if (!wordData) return 9999; // Unknown target
  
  for (const rankGroup of wordData) {
    if (rankGroup.similar.includes(lowerGuess)) {
      return rankGroup.rank;
    }
  }
  
  // Not in database - assign high rank
  return Math.floor(Math.random() * 8000) + 2000;
}

// Get similarity percentage (for visual feedback)
export function getSimilarityPercentage(rank: number): number {
  if (rank === 1) return 100;
  if (rank <= 10) return 90;
  if (rank <= 50) return 80;
  if (rank <= 100) return 70;
  if (rank <= 500) return 50;
  if (rank <= 1000) return 30;
  return Math.max(5, 100 - Math.log10(rank) * 15);
}

// Get color category based on rank
export function getSimilarityColor(rank: number): string {
  if (rank === 1) return 'perfect';
  if (rank <= 10) return 'excellent';
  if (rank <= 50) return 'great';
  if (rank <= 100) return 'good';
  if (rank <= 500) return 'medium';
  if (rank <= 1000) return 'poor';
  return 'cold';
}

// Get a hint word
export function getHint(targetWord: string, usedHints: number): string | null {
  const wordData = wordDatabase[targetWord.toLowerCase()];
  if (!wordData || usedHints >= 3) return null;
  
  const rank1Words = wordData[0]?.similar || [];
  if (usedHints < rank1Words.length) {
    return rank1Words[usedHints];
  }
  return null;
}

// Load game state from localStorage
export function loadGameState(): GameState | null {
  const stored = localStorage.getItem('semanticGameState');
  if (!stored) return null;
  
  const state = JSON.parse(stored) as GameState;
  const today = getDailyWord();
  
  // Reset if it's a new day
  if (state.targetWord !== today) {
    return null;
  }
  
  return state;
}

// Save game state to localStorage
export function saveGameState(state: GameState): void {
  localStorage.setItem('semanticGameState', JSON.stringify(state));
}

