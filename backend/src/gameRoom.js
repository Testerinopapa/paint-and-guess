import crypto from "crypto";

export class GameRoom {
  constructor({ id, name, isPublic, maxPlayers, roundTime, maxRounds = 6, wordPack = "classic" }) {
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.maxPlayers = maxPlayers;
    this.roundTime = roundTime;
    this.maxRounds = maxRounds;
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
    // Session tokens for secure reconnection (playerId -> sessionToken)
    this.sessionTokens = new Map();
  }

  /**
   * Generate a session token for a player
   */
  generateSessionToken(playerId) {
    const token = crypto.randomBytes(32).toString("hex");
    this.sessionTokens.set(playerId, token);
    return token;
  }

  /**
   * Validate a session token for reconnection
   */
  validateSessionToken(playerId, token) {
    const storedToken = this.sessionTokens.get(playerId);
    return storedToken && storedToken === token;
  }

  /**
   * Get a player by their stable ID
   */
  getPlayerById(playerId) {
    return this.players.find((p) => p.id === playerId);
  }

  /**
   * Add a new player to the room
   * Player object should have: id, name, socketId, avatar (optional)
   */
  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error("Room is full");
    }

    // Store the player with all properties intact
    this.players.push(player);

    if (!this.ownerId) {
      this.ownerId = player.id;
      console.log(`[GameRoom:${this.id}] 🎖️ Host assigned: ${player.name} (${player.id})`);
    }
    console.log(`[GameRoom:${this.id}] ➕ Player joined: ${player.name} (${this.players.length}/${this.maxPlayers})`);
    
    // Return the stored player reference so caller can work with it
    return player;
  }

  /**
   * Update a returning player's socket ID
   */
  updatePlayerSocket(playerId, socketId) {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.socketId = socketId;
      console.log(`[GameRoom:${this.id}] 🔄 Updated socket for ${player.name}: ${socketId}`);
      return player;
    }
    return null;
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

  /**
   * Serialize room for network transmission (excludes sensitive data)
   */
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

  /**
   * Serialize room for persistence (includes all state)
   */
  serialize() {
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
        hasGuessed: p.hasGuessed ?? false,
        avatar: p.avatar ?? null,
        // Note: socketId is intentionally excluded as it's ephemeral
      })),
      isGameActive: this.isGameActive,
      ownerId: this.ownerId,
      currentDrawerId: this.currentDrawer?.id ?? null,
      currentWord: this.currentWord,
      roundNumber: this.roundNumber,
      elapsedTime: this.elapsedTime,
      wordHistory: this.wordHistory,
      drawerRewarded: this.drawerRewarded,
      isRoundActive: this.isRoundActive,
      sessionTokens: Array.from(this.sessionTokens.entries()),
    };
  }

  /**
   * Deserialize room from persistent storage
   */
  static fromJSON(data) {
    const room = new GameRoom({
      id: data.id,
      name: data.name,
      isPublic: data.isPublic,
      maxPlayers: data.maxPlayers,
      roundTime: data.roundTime,
      maxRounds: data.maxRounds,
      wordPack: data.wordPack,
    });

    // Restore players (without socketId - they'll reconnect)
    room.players = data.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isReady: p.isReady,
      hasGuessed: p.hasGuessed ?? false,
      avatar: p.avatar ?? null,
      socketId: null, // Will be set on reconnection
    }));

    // Restore game state
    room.isGameActive = data.isGameActive ?? false;
    room.ownerId = data.ownerId;
    room.roundNumber = data.roundNumber ?? 0;
    room.elapsedTime = data.elapsedTime ?? 0;
    room.wordHistory = data.wordHistory ?? [];
    room.drawerRewarded = data.drawerRewarded ?? false;
    room.isRoundActive = data.isRoundActive ?? false;
    room.currentWord = data.currentWord ?? null;

    // Restore current drawer reference
    if (data.currentDrawerId) {
      room.currentDrawer = room.players.find((p) => p.id === data.currentDrawerId) ?? null;
    }

    // Restore session tokens
    if (data.sessionTokens) {
      room.sessionTokens = new Map(data.sessionTokens);
    }

    // Note: timer is NOT restored - it will be restarted when drawer reconnects
    
    return room;
  }
}

