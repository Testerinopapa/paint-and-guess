export class GameRoom {
  constructor({ id, name, isPublic, maxPlayers, roundTime, maxRounds = 6 }) {
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.maxPlayers = maxPlayers;
    this.roundTime = roundTime;
    this.maxRounds = maxRounds;
    this.players = [];
    this.isGameActive = false;
    this.currentDrawer = null;
    this.currentWord = null;
    this.roundNumber = 0;
    this.elapsedTime = 0;
    this.timer = null;
    this.ownerId = null;
    this.wordHistory = [];
    this.drawerRewarded = false;
    this.isRoundActive = false;
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error("Room is full");
    }
    this.players.push(player);

    if (!this.ownerId) {
      this.ownerId = player.id;
    }
  }

  removePlayer(playerId) {
    this.players = this.players.filter((p) => p.id !== playerId);
    if (this.currentDrawer?.id === playerId) {
      this.currentDrawer = null;
    }

    if (this.ownerId === playerId) {
      this.ownerId = this.players[0]?.id ?? null;
    }
  }

  setPlayerReady(playerId, isReady) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      return;
    }
    player.isReady = isReady;
  }

  allPlayersReady() {
    return this.players.length >= 2 && this.players.every((player) => player.isReady);
  }

  startGame(getRandomWord) {
    if (this.players.length < 2) {
      throw new Error("Need at least 2 players");
    }
    if (!this.allPlayersReady()) {
      throw new Error("All players must be ready");
    }
    this.isGameActive = true;
    this.roundNumber = 0;
    this.currentDrawer = null;
    this.wordHistory = [];
    this.players.forEach((player) => {
      player.hasGuessed = false;
      player.isReady = false;
    });
    this.nextRound(getRandomWord);
  }

  nextRound(getRandomWord) {
    if (this.roundNumber >= this.maxRounds) {
      throw new Error("Maximum rounds reached");
    }

    // Reset player guess states
    this.players.forEach((p) => {
      p.hasGuessed = false;
    });

    this.drawerRewarded = false;

    // Rotate drawer
    if (!this.currentDrawer) {
      // First round - pick random player
      this.currentDrawer = this.players[Math.floor(Math.random() * this.players.length)];
    } else {
      // Find current drawer index and move to next
      const currentIndex = this.players.findIndex((p) => p.id === this.currentDrawer.id);
      const nextIndex = (currentIndex + 1) % this.players.length;
      this.currentDrawer = this.players[nextIndex];
    }

    this.roundNumber++;
    this.elapsedTime = 0;
    this.currentWord = getRandomWord();
    this.wordHistory.push(this.currentWord);
    this.isRoundActive = true;
  }

  endRound() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsedTime = 0;
    this.isRoundActive = false;
  }

  startRoundTimer(onTick) {
    this.elapsedTime = 0;
    this.isRoundActive = true;
    this.timer = setInterval(() => {
      this.elapsedTime++;
      const timeLeft = Math.max(0, this.roundTime - this.elapsedTime);
      onTick(timeLeft);
      
      if (timeLeft === 0) {
        this.endRound();
      }
    }, 1000);
  }

  shouldEndGame() {
    return this.roundNumber >= this.maxRounds;
  }

  markDrawerRewarded() {
    this.drawerRewarded = true;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      maxPlayers: this.maxPlayers,
      roundTime: this.roundTime,
      maxRounds: this.maxRounds,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isReady: p.isReady,
        avatar: p.avatar ?? null,
      })),
      isGameActive: this.isGameActive,
      ownerId: this.ownerId,
      currentDrawer: this.currentDrawer
        ? {
            id: this.currentDrawer.id,
            name: this.currentDrawer.name,
          }
        : null,
      roundNumber: this.roundNumber,
    };
  }
}

