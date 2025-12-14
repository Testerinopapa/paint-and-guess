import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award, User } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type GameType = "chess" | "trivia";
type TimePeriod = "all-time" | "week" | "month" | "year";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;
}

const fetchLeaderboard = async (gameType: GameType): Promise<LeaderboardEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/api/ratings/${gameType}/leaderboard?limit=100`);
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  const data = await response.json();
  return data.leaderboard || [];
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return null;
};

const getRankLabel = (rank: number) => {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}`;
};

const formatRating = (rating: number) => {
  return rating.toLocaleString();
};

const LeaderboardTable = ({ gameType }: { gameType: GameType }) => {
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ["leaderboard", gameType],
    queryFn: () => fetchLeaderboard(gameType),
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-card">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load leaderboard</p>
        <p className="text-sm mt-2">{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No players yet</p>
        <p className="text-sm mt-2">Be the first to play and get on the leaderboard!</p>
      </div>
    );
  }

  const maxRating = Math.max(...leaderboard.map((entry) => entry.rating));

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, index) => {
        const avatarConfig = safeLoadAvatarConfig(entry.userId);
        const progressPercentage = (entry.rating / maxRating) * 100;

        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
              entry.rank <= 3
                ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
                : "bg-card hover:bg-accent"
            }`}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
              {getRankIcon(entry.rank) || (
                <span
                  className={`text-lg font-bold ${
                    entry.rank <= 3 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {getRankLabel(entry.rank)}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage
                  src={
                    avatarConfig
                      ? `https://api.dicebear.com/7.x/${avatarConfig.style}/svg?seed=${avatarConfig.seed}`
                      : undefined
                  }
                  alt={entry.username}
                />
                <AvatarFallback>
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{entry.username}</p>
                <p className="text-sm text-muted-foreground">Player</p>
              </div>
            </div>

            {/* Rating with Progress Bar */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold">{formatRating(entry.rating)}</span>
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const Leaderboard = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>("chess");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-time");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Compete with players and climb the rankings
        </p>
      </motion.div>

      {/* Game Type Tabs */}
      <Tabs value={selectedGame} onValueChange={(value) => setSelectedGame(value as GameType)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="chess">Chess</TabsTrigger>
            <TabsTrigger value="trivia">Trivia Blitz</TabsTrigger>
          </TabsList>

          {/* Time Period Tabs */}
          <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
            <TabsList className="grid w-full sm:w-auto grid-cols-4">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="all-time">All-Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Leaderboard Content */}
        <TabsContent value="chess" className="mt-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Chess Rankings</h2>
              <span className="text-sm text-muted-foreground">
                {timePeriod === "all-time" ? "All-Time" : timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
              </span>
            </div>
            <LeaderboardTable gameType="chess" />
          </div>
        </TabsContent>

        <TabsContent value="trivia" className="mt-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Trivia Blitz Rankings</h2>
              <span className="text-sm text-muted-foreground">
                {timePeriod === "all-time" ? "All-Time" : timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
              </span>
            </div>
            <LeaderboardTable gameType="trivia" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
