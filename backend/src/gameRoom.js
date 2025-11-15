export class GameRoom {
  constructor({
    id,
    name,
    isPublic,
    maxPlayers,
    roundTime,
    maxRounds = 6,
    players = [],
    isGameActive = false,
    currentDrawerId = null,
    currentWord = null,
    roundNumber = 0,
    elapsedTime = 0,
    ownerId = null,
    wordHistory = [],
    drawerRewarded = false,
    isRoundActive = false,
    roundEndsAt = null,
  }) {
  constructor({ id, name, isPublic, maxPlayers, roundTime, maxRounds = 6, wordPack = "classic" }) {
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.maxPlayers = maxPlayers;
    this.roundTime = roundTime;
    this.maxRounds = maxRounds;
    this.players = players.map((player) => ({ ...player }));
    this.isGameActive = isGameActive;
    this.currentDrawer = currentDrawerId
      ? this.players.find((player) => player.id === currentDrawerId) ?? null
      : null;
    this.currentWord = currentWord;
    this.roundNumber = roundNumber;
    this.elapsedTime = elapsedTime;
    this.timer = null;
    this.ownerId = ownerId;
    this.wordHistory = [...wordHistory];
    this.drawerRewarded = drawerRewarded;
    this.isRoundActive = isRoundActive;
    this.roundEndsAt = roundEndsAt;
    this.wordPack = wordPack;
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
    this.players.push({ ...player });

    if (!this.ownerId) {
      this.ownerId = player.id;
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

    if (this.ownerId === playerId) {
      this.ownerId = this.players[0]?.id ?? null;
    }
  }

  getPlayerById(playerId) {
    return this.players.find((player) => player.id === playerId) ?? null;
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
    this.players = this.players.map((player) => ({
      ...player,
      hasGuessed: false,
      isReady: false,
    }));
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
    this.players = this.players.map((player) => ({
      ...player,
      hasGuessed: false,
    }));

    this.drawerRewarded = false;

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
    this.roundEndsAt = null;
    console.log(`[GameRoom:${this.id}] 🔄 Round ${this.roundNumber}/${this.maxRounds} started! Drawer: ${this.currentDrawer.name}, Word: "${this.currentWord}"`);
  }

  endRound() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsedTime = 0;
    this.isRoundActive = false;
    this.roundEndsAt = null;
    console.log(`[GameRoom:${this.id}] ⏸️ Round ${this.roundNumber}/${this.maxRounds} ended`);
  }

  startRoundTimer(onTick) {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.elapsedTime = 0;
    this.isRoundActive = true;
    this.roundEndsAt = Date.now() + this.roundTime * 1000;

    const tick = () => {
      const timeLeft = this.getTimeRemainingSeconds();
      this.elapsedTime = Math.max(0, this.roundTime - timeLeft);
      Promise.resolve(onTick(timeLeft)).catch((error) => {
        console.error("Failed to handle round timer tick", error);
      });

    this.timer = setInterval(() => {
      this.elapsedTime++;
      const timeLeft = Math.max(0, this.roundTime - this.elapsedTime);
      onTick(timeLeft);
      
      if (timeLeft === 0) {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    };

    // Emit an initial tick so clients have the full round time immediately
    tick();

    this.timer = setInterval(tick, 1000);
  }

  shouldEndGame() {
    return this.roundNumber >= this.maxRounds;
  }

  markDrawerRewarded() {
    this.drawerRewarded = true;
  }

  getTimeRemainingSeconds() {
    if (!this.isRoundActive || !this.roundEndsAt) {
      return this.roundTime;
    }
    return Math.max(0, Math.ceil((this.roundEndsAt - Date.now()) / 1000));
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
      wordPack: this.wordPack,
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

  serialize() {
    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      maxPlayers: this.maxPlayers,
      roundTime: this.roundTime,
      maxRounds: this.maxRounds,
      players: this.players.map(({ socketId, ...player }) => ({ ...player })),
      isGameActive: this.isGameActive,
      ownerId: this.ownerId,
      currentDrawerId: this.currentDrawer?.id ?? null,
      currentWord: this.currentWord,
      roundNumber: this.roundNumber,
      elapsedTime: this.elapsedTime,
      wordHistory: [...this.wordHistory],
      drawerRewarded: this.drawerRewarded,
      isRoundActive: this.isRoundActive,
      roundEndsAt: this.roundEndsAt,
    };
  }

  static fromState(state) {
    return new GameRoom(state);
  }

  resetAfterRestart() {
    // Clear transient runtime state that cannot be restored without active socket connections
    this.players = [];
    this.ownerId = null;
    this.isGameActive = false;
    this.currentDrawer = null;
    this.currentWord = null;
    this.roundNumber = 0;
    this.elapsedTime = 0;
    this.wordHistory = [];
    this.drawerRewarded = false;
    this.isRoundActive = false;
    this.roundEndsAt = null;
  }
}

