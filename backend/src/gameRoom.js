export class GameRoom {
  constructor({ id, name, isPublic, maxPlayers, roundTime, wordPack = "classic" }) {
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.maxPlayers = maxPlayers;
    this.roundTime = roundTime;
    this.wordPack = wordPack;
    this.players = [];
    this.isGameActive = false;
    this.currentDrawer = null;
    this.currentWord = null;
    this.roundNumber = 0;
    this.elapsedTime = 0;
    this.timer = null;
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error("Room is full");
    }
    this.players.push(player);
  }

  removePlayer(playerId) {
    this.players = this.players.filter((p) => p.id !== playerId);
    if (this.currentDrawer?.id === playerId) {
      this.currentDrawer = null;
    }
  }

  startGame(getRandomWord) {
    if (this.players.length < 2) {
      throw new Error("Need at least 2 players");
    }
    this.isGameActive = true;
    this.roundNumber = 1;
    this.nextRound(getRandomWord);
  }

  nextRound(getRandomWord) {
    // Reset player guess states
    this.players.forEach((p) => {
      p.hasGuessed = false;
    });

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
  }

  endRound() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsedTime = 0;
  }

  startRoundTimer(onTick) {
    this.elapsedTime = 0;
    this.timer = setInterval(() => {
      this.elapsedTime++;
      const timeLeft = Math.max(0, this.roundTime - this.elapsedTime);
      onTick(timeLeft);
      
      if (timeLeft === 0) {
        this.endRound();
      }
    }, 1000);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      maxPlayers: this.maxPlayers,
      roundTime: this.roundTime,
      wordPack: this.wordPack,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isReady: p.isReady,
      })),
      isGameActive: this.isGameActive,
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

