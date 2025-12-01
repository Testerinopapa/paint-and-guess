import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserPlus, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Friend {
  id: string;
  name: string;
  level: number;
  status: "online" | "offline" | "in-game";
  avatar: string;
  currentGame?: string;
}

const Friends = () => {
  const isMobile = useIsMobile();
  
  const featuredFriends: Friend[] = [
    { id: "1", name: "YETI", level: 4, status: "online", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
    { id: "2", name: "HOLLYWOOD", level: 7, status: "in-game", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop", currentGame: "Counter-Strike" },
    { id: "3", name: "FORTUNE", level: 7, status: "online", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
  ];

  const allFriends: Friend[] = [
    ...featuredFriends,
    { id: "4", name: "STRIKER", level: 12, status: "in-game", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop", currentGame: "Overwatch" },
    { id: "5", name: "PHOENIX", level: 8, status: "online", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" },
    { id: "6", name: "SHADOW", level: 15, status: "offline", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop" },
    { id: "7", name: "BLAZE", level: 6, status: "online", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
    { id: "8", name: "NOVA", level: 10, status: "in-game", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop", currentGame: "Rocket League" },
  ];

  const getStatusColor = (status: Friend["status"]) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "in-game": return "bg-primary";
      case "offline": return "bg-muted-foreground";
    }
  };

  const getStatusText = (friend: Friend) => {
    if (friend.status === "in-game" && friend.currentGame) {
      return `Playing ${friend.currentGame}`;
    }
    return friend.status.charAt(0).toUpperCase() + friend.status.slice(1);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <motion.div 
        className="mb-4 md:mb-6"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-2xl md:text-4xl font-bold mb-2 uppercase tracking-wider"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Friends Squad
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-sm md:text-base"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Assemble your gaming crew
        </motion.p>
      </motion.div>

      {/* Featured Friends Display */}
      <motion.div 
        className="mb-6 md:mb-8 relative"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-accent/10 to-transparent rounded-xl blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-secondary via-background to-secondary/50 rounded-xl border border-border/50 p-4 md:p-6 lg:p-12">
          <div className="absolute top-3 left-3 md:top-4 md:left-4 lg:top-6 lg:left-6">
            <h2 className="text-sm md:text-lg lg:text-2xl font-bold text-muted-foreground uppercase tracking-widest italic">
              Operation: Squad Up
            </h2>
          </div>
          
          <div className="flex justify-center items-end gap-3 md:gap-4 lg:gap-8 mt-10 md:mt-12 lg:mt-16 mb-6 md:mb-8">
            {featuredFriends.map((friend, index) => (
              <motion.div 
                key={friend.id} 
                className={`flex flex-col items-center ${index === 1 ? 'scale-110 md:scale-125' : ''}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: index === 1 ? 1.1 : 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.3 + index * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                whileHover={{ scale: index === 1 ? 1.15 : 1.05 }}
              >
                <div className="relative mb-3 md:mb-4">
                  <div className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full border-4 border-primary/50 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 shadow-2xl shadow-primary/30">
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                  </div>
                  <motion.div 
                    className={`absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full border-2 border-background ${getStatusColor(friend.status)}`}
                    animate={{ 
                      scale: friend.status === "online" || friend.status === "in-game" ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: friend.status === "online" || friend.status === "in-game" ? Infinity : 0,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  ></motion.div>
                </div>
                <div className="bg-gradient-to-r from-primary/80 to-accent/80 px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm">
                  <p className="font-bold text-white text-xs md:text-sm uppercase tracking-wider">{friend.name}</p>
                  <p className="text-xs text-white/80">LV. {friend.level}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 md:gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Button 
                size="lg"
                className="w-full h-11 md:h-12 lg:h-14 text-sm md:text-base lg:text-lg font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30"
              >
                <Users className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Form Squad
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Button 
                size="lg"
                variant="outline"
                className="w-full h-11 md:h-12 lg:h-14 text-sm md:text-base lg:text-lg font-bold uppercase tracking-wider border-2 border-primary/50 bg-primary/10 hover:bg-primary/20 text-foreground"
              >
                Invite to Party
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <Button 
                size="lg"
                variant="outline"
                className="w-full h-11 md:h-12 lg:h-14 text-sm md:text-base lg:text-lg font-bold uppercase tracking-wider border-2 border-accent/50 bg-accent/10 hover:bg-accent/20 text-foreground"
              >
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Group Chat
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* All Friends List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold">All Friends</h2>
          <Button variant="outline" size="sm" className="h-9 md:h-10">
            <UserPlus className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            <span className="text-xs md:text-sm">Add Friend</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {allFriends.map((friend, index) => (
            <motion.div 
              key={friend.id}
              variants={itemVariants}
              className="group relative bg-card border border-border rounded-lg p-3 md:p-4 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="relative">
                  <Avatar className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 border-2 border-primary/30">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback>{friend.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <motion.div 
                    className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-card ${getStatusColor(friend.status)}`}
                    animate={{ 
                      scale: friend.status === "online" || friend.status === "in-game" ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: friend.status === "online" || friend.status === "in-game" ? Infinity : 0,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  ></motion.div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs md:text-sm lg:text-base uppercase tracking-wide truncate">{friend.name}</h3>
                  <p className="text-xs text-muted-foreground">Level {friend.level}</p>
                  <p className={`text-xs mt-1 ${friend.status === 'in-game' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {getStatusText(friend)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8 md:h-9">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Chat
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8 md:h-9">
                  Invite
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Friends;

