export interface Opponent {
  id: string;
  name: string;
  avatar: string; // URL or path to avatar image
  rating: number;
  elo: number;
  depth: number;
  description: string;
  category: "beginner" | "intermediate" | "advanced" | "expert" | "master" | "custom";
  country?: string; // Country code for flag
  featured?: boolean;
  color?: "white" | "black"; // Which color the opponent plays
}

export const OPPONENTS: Record<string, Opponent[]> = {
  beginner: [
    {
      id: "beginner-bot",
      name: "Beginner Bot",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=beginner",
      rating: 1000,
      elo: 1000,
      depth: 4,
      description: "A friendly opponent perfect for learning the basics. Makes frequent mistakes and responds quickly.",
      category: "beginner",
      featured: true,
      color: "black",
    },
    {
      id: "casual-bot",
      name: "Casual Player",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=casual",
      rating: 1200,
      elo: 1200,
      depth: 5,
      description: "A relaxed opponent for casual games. Good for practice.",
      category: "beginner",
      color: "black",
    },
  ],
  intermediate: [
    {
      id: "rapid-bot",
      name: "Rapid Player",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=rapid",
      rating: 1300,
      elo: 1300,
      depth: 5,
      description: "Fast-paced games with quick decision making.",
      category: "intermediate",
      color: "black",
    },
    {
      id: "club-player-bot",
      name: "Club Player",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=club",
      rating: 1400,
      elo: 1400,
      depth: 6,
      description: "A solid club player level opponent. Quick moves with good fundamentals.",
      category: "intermediate",
      color: "black",
    },
    {
      id: "improving-bot",
      name: "Improving Player",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=improving",
      rating: 1500,
      elo: 1500,
      depth: 6,
      description: "An improving player with solid opening knowledge and tactics.",
      category: "intermediate",
      color: "black",
    },
  ],
  advanced: [
    {
      id: "advanced-bot",
      name: "Advanced Player",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=advanced",
      rating: 1800,
      elo: 1800,
      depth: 8,
      description: "A strong club player with excellent tactical awareness.",
      category: "advanced",
      color: "black",
    },
    {
      id: "tactical-bot",
      name: "Tactical Master",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=tactical",
      rating: 1900,
      elo: 1900,
      depth: 8,
      description: "Excellent at spotting tactics and combinations.",
      category: "advanced",
      color: "black",
    },
    {
      id: "strong-bot",
      name: "Strong Player",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=strong",
      rating: 2000,
      elo: 2000,
      depth: 9,
      description: "Expert level play with deep strategic understanding.",
      category: "advanced",
      color: "black",
    },
  ],
  expert: [
    {
      id: "expert-bot",
      name: "Expert",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=expert",
      rating: 2200,
      elo: 2200,
      depth: 10,
      description: "Master level strength. A formidable opponent.",
      category: "expert",
      color: "black",
    },
    {
      id: "candidate-bot",
      name: "Candidate Master",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=candidate",
      rating: 2400,
      elo: 2400,
      depth: 11,
      description: "Candidate Master level. Extremely challenging.",
      category: "expert",
      color: "black",
    },
  ],
  master: [
    {
      id: "master-bot",
      name: "Master",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=master",
      rating: 2600,
      elo: 2600,
      depth: 12,
      description: "Grandmaster level. The ultimate challenge.",
      category: "master",
      color: "black",
    },
    {
      id: "legendary-bot",
      name: "Legendary",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=legendary",
      rating: 2800,
      elo: 2800,
      depth: 13,
      description: "Super Grandmaster level. Only for the bravest.",
      category: "master",
      color: "black",
    },
    {
      id: "maximum-bot",
      name: "Stockfish Max",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=stockfish",
      rating: 3200,
      elo: undefined, // No limit
      depth: 14,
      description: "Full Stockfish strength. Nearly unbeatable.",
      category: "master",
      featured: true,
      color: "black",
    },
  ],
};

// Helper function to get all opponents
export function getAllOpponents(): Opponent[] {
  return Object.values(OPPONENTS).flat();
}

// Helper function to get opponent by ID
export function getOpponentById(id: string): Opponent | undefined {
  return getAllOpponents().find(opp => opp.id === id);
}

