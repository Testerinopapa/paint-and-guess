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
      console.log(`[GameRoom:${this.id}] 🎖️ Host assigned: ${player.name} (${player.id})`);
    }
    console.log(`[GameRoom:${this.id}] ➕ Player joined: ${player.name} (${this.players.length}/${this.maxPlayers})`);
  }

  removePlayer(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    this.players = this.players.filter((p) => p.id !== playerId);
    if (this.currentDrawer?.id === playerId) {
      this.currentDrawer = null;
      console.log(`[GameRoom:${this.id}] 🎨 Drawer disconnected`);
    }

    if (this.ownerId === playerId) {
      this.ownerId = this.players[0]?.id ?? null;
      console.log(`[GameRoom:${this.id}] 🎖️ Host transferred: ${this.players[0]?.name || 'none'} (${this.ownerId})`);
    }
    console.log(`[GameRoom:${this.id}] ➖ Player left: ${player?.name || playerId} (${this.players.length}/${this.maxPlayers})`);
  }

  setPlayerReady(playerId, isReady) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      return;
    }
    player.isReady = isReady;
    const readyCount = this.players.filter(p => p.isReady).length;
    console.log(`[GameRoom:${this.id}] ${isReady ? '✅' : '❌'} ${player.name} ready: ${isReady} (${readyCount}/${this.players.length} ready)`);
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
    console.log(`[GameRoom:${this.id}] 🎮 Game starting! Players: ${this.players.length}, Max Rounds: ${this.maxRounds}`);
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
    console.log(`[GameRoom:${this.id}] 🔄 Round ${this.roundNumber}/${this.maxRounds} started! Drawer: ${this.currentDrawer.name}, Word: "${this.currentWord}"`);
  }

  endRound() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsedTime = 0;
    this.isRoundActive = false;
    console.log(`[GameRoom:${this.id}] ⏸️ Round ${this.roundNumber}/${this.maxRounds} ended`);
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
    const shouldEnd = this.roundNumber >= this.maxRounds;
    if (shouldEnd) {
      console.log(`[GameRoom:${this.id}] 🏁 Game ending: Max rounds (${this.maxRounds}) reached`);
    }
    return shouldEnd;
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

