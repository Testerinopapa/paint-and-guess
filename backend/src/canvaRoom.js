export class CanvaRoom {
  constructor({
    id,
    name,
    isPublic = true,
    maxPlayers = 10,
    players = [],
    isGameActive = false,
    ownerId = null,
    gamePin = null,
    // Game flow properties
    roundTime = 60,
    maxRounds = 6,
    wordPack = "classic",
    currentDrawerId = null,
    currentWord = null,
    roundNumber = 0,
    elapsedTime = 0,
    wordHistory = [],
    drawerRewarded = false,
    isRoundActive = false,
    roundEndsAt = null,
  }) {
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.maxPlayers = maxPlayers;
    this.players = players.map((player) => ({
      ...player,
      connected: player.connected ?? false,
      lastSeen: player.lastSeen ?? Date.now(),
      socketId: player.socketId ?? null,
      hasGuessed: player.hasGuessed ?? false,
      isReady: player.isReady ?? false,
      score: player.score ?? 0,
    }));
    this.isGameActive = isGameActive;
    this.ownerId = ownerId;
    this.gamePin = gamePin || this.generatePin();
    
    // Game flow properties
    this.roundTime = roundTime;
    this.maxRounds = maxRounds;
    this.wordPack = wordPack;
    this.currentDrawer = currentDrawerId
      ? this.players.find((player) => player.id === currentDrawerId) ?? null
      : null;
    this.currentWord = currentWord;
    this.roundNumber = roundNumber;
    this.elapsedTime = elapsedTime;
    this.timer = null;
    this.wordHistory = [...wordHistory];
    this.drawerRewarded = drawerRewarded;
    this.isRoundActive = isRoundActive;
    this.roundEndsAt = roundEndsAt;
  }

  generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getPlayerById(playerId) {
    return this.players.find((player) => player.id === playerId) ?? null;
  }

  addPlayer(player) {
    if (this.getActivePlayerCount() >= this.maxPlayers) {
      throw new Error("Room is full");
    }

    const enrichedPlayer = {
      ...player,
      connected: true,
      lastSeen: Date.now(),
      socketId: player.socketId ?? null,
      score: player.score ?? 0, // Initialize score to 0 if not provided
      hasGuessed: player.hasGuessed ?? false,
      isReady: player.isReady ?? false,
    };

    this.players.push(enrichedPlayer);
    this.#ensureOwner();
  }

  removePlayer(playerId) {
    this.players = this.players.filter((p) => p.id !== playerId);
    if (this.ownerId === playerId) {
      this.#ensureOwner();
    }
  }

  markPlayerConnected(playerId, socketId) {
    const player = this.getPlayerById(playerId);
    if (!player) return;

    player.connected = true;
    player.socketId = socketId;
    player.lastSeen = Date.now();
    this.#ensureOwner();
  }

  markPlayerDisconnected(playerId) {
    const player = this.getPlayerById(playerId);
    if (!player) return;

    player.connected = false;
    player.socketId = null;
    player.lastSeen = Date.now();

    if (this.ownerId === playerId) {
      this.#ensureOwner();
    }
  }

  getActivePlayerCount() {
    return this.players.filter((p) => p.connected).length;
  }

  #ensureOwner() {
    const activePlayers = this.players.filter((p) => p.connected);
    if (activePlayers.length === 0) {
      this.ownerId = null;
      return;
    }

    if (!this.ownerId || !this.getPlayerById(this.ownerId)?.connected) {
      this.ownerId = activePlayers[0].id;
    }
  }

  getActivePlayers() {
    return this.players.filter((p) => p.connected);
  }

  allPlayersReady() {
    const activePlayers = this.getActivePlayers();
    return activePlayers.length >= 2 && activePlayers.every((player) => player.isReady);
  }

  setPlayerReady(playerId, isReady) {
    const player = this.players.find((p) => p.id === playerId && p.connected);
    if (!player) return;
    player.isReady = isReady;
  }

  startGame(getRandomWord) {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length < 2) {
      throw new Error("Need at least 2 players");
    }
    if (!this.allPlayersReady()) {
      throw new Error("All players must be ready");
    }
    this.isGameActive = true;
    this.roundNumber = 0;
    this.currentDrawer = null;
    this.wordHistory = [];
    this.players = this.players.map((player) => ({
      ...player,
      hasGuessed: player.connected ? false : player.hasGuessed,
      isReady: player.connected ? false : player.isReady,
    }));
    
    console.log(`[CanvaRoom] Starting game - active players: [${activePlayers.map(p => `${p.name}(${p.id})`).join(', ')}]`);
    this.nextRound(getRandomWord);
    console.log(`[CanvaRoom] Game started - first drawer: ${this.currentDrawer?.name} (${this.currentDrawer?.id})`);
  }

  nextRound(getRandomWord) {
    if (this.roundNumber >= this.maxRounds) {
      throw new Error("Maximum rounds reached");
    }

    // CRITICAL: Save current drawer ID before resetting players (to avoid stale reference)
    const previousDrawerId = this.currentDrawer?.id;

    // Reset player guess states
    this.players = this.players.map((player) => ({
      ...player,
      hasGuessed: false,
    }));

    this.drawerRewarded = false;

    // Get active players AFTER resetting player states (to use updated objects)
    const activePlayers = this.getActivePlayers();

    if (activePlayers.length < 2) {
      throw new Error("Not enough active players");
    }

    // Rotate drawer - use the saved ID to find the drawer in active players
    let newDrawerId = null;
    
    if (!previousDrawerId) {
      // First round - pick random active player
      const randomIndex = Math.floor(Math.random() * activePlayers.length);
      newDrawerId = activePlayers[randomIndex].id;
    } else {
      // Find previous drawer index within active players and move to next
      const currentIndex = activePlayers.findIndex((p) => p.id === previousDrawerId);
      
      if (currentIndex === -1) {
        // Previous drawer not found in active players - pick random
        const randomIndex = Math.floor(Math.random() * activePlayers.length);
        newDrawerId = activePlayers[randomIndex].id;
      } else {
        const nextIndex = (currentIndex + 1) % activePlayers.length;
        newDrawerId = activePlayers[nextIndex].id;
      }
    }

    // Get fresh reference from updated players array
    const newDrawer = this.players.find((p) => p.id === newDrawerId && p.connected);
    if (!newDrawer) {
      throw new Error(`Failed to find drawer with id ${newDrawerId} in players array`);
    }
    
    this.currentDrawer = newDrawer;

    this.roundNumber++;
    this.elapsedTime = 0;
    this.currentWord = getRandomWord();
    this.wordHistory.push(this.currentWord);
    this.isRoundActive = true;
    this.roundEndsAt = null;
  }

  endRound() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsedTime = 0;
    this.isRoundActive = false;
    this.roundEndsAt = null;
  }

  startRoundTimer(onTick) {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.elapsedTime = 0;
    this.isRoundActive = true;
    this.roundEndsAt = Date.now() + this.roundTime * 1000;

    let hasCalledEnd = false; // Prevent multiple calls to endCanvaRound

    const tick = () => {
      // If round is no longer active, stop the timer immediately
      if (!this.isRoundActive) {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        return;
      }

      const timeLeft = this.getTimeRemainingSeconds();
      this.elapsedTime = Math.max(0, this.roundTime - timeLeft);
      
      if (timeLeft > 0) {
        // Normal tick - update clients with remaining time
        Promise.resolve(onTick(timeLeft)).catch((error) => {
          console.error("Failed to handle round timer tick", error);
        });
      } else if (timeLeft === 0 && !hasCalledEnd) {
        // Time expired - call end logic exactly once
        hasCalledEnd = true;
        // Clear timer immediately to prevent any further ticks
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        // Call onTick(0) which will trigger endCanvaRound
        Promise.resolve(onTick(0)).catch((error) => {
          console.error("Failed to handle round timer end", error);
        });
      }
      // If timeLeft === 0 and hasCalledEnd is true, do nothing (timer already cleared)
    };

    // Emit an initial tick so clients have the full round time immediately
    tick();

    this.timer = setInterval(tick, 1000);
  }

  getTimeRemainingSeconds() {
    if (!this.isRoundActive || !this.roundEndsAt) {
      return this.roundTime;
    }
    return Math.max(0, Math.ceil((this.roundEndsAt - Date.now()) / 1000));
  }

  makeGuess(playerId, guess, isCorrect) {
    const player = this.players.find((p) => p.id === playerId && p.connected);
    if (!player || player.hasGuessed || player.id === this.currentDrawer?.id) {
      return false;
    }

    player.hasGuessed = true;

    if (isCorrect) {
      const timeRemaining = this.getTimeRemainingSeconds();
      const points = Math.max(1, Math.floor(timeRemaining / 10) + 10);
      player.score += points;

      // Give drawer points too
      if (this.currentDrawer && !this.drawerRewarded) {
        this.currentDrawer.score += 5;
        this.drawerRewarded = true;
      }

      return { correct: true, points, playerName: player.name };
    }

    return { correct: false, playerName: player.name };
  }

  shouldEndGame() {
    return this.roundNumber >= this.maxRounds || this.getActivePlayerCount() < 2;
  }

  markDrawerRewarded() {
    this.drawerRewarded = true;
  }

  toJSON() {
    const drawer = this.currentDrawer?.connected ? this.currentDrawer : null;

    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      maxPlayers: this.maxPlayers,
      players: this.getActivePlayers().map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        connected: p.connected,
        score: p.score ?? 0, // Ensure score is always a number
        isReady: p.isReady ?? false,
        hasGuessed: p.hasGuessed ?? false,
      })),
      isGameActive: this.isGameActive,
      ownerId: this.ownerId,
      gamePin: this.gamePin,
      // Game flow properties
      roundTime: this.roundTime,
      maxRounds: this.maxRounds,
      wordPack: this.wordPack,
      currentDrawer: drawer
        ? {
            id: drawer.id,
            name: drawer.name,
          }
        : null,
      currentWord: this.currentWord,
      roundNumber: this.roundNumber,
      isRoundActive: this.isRoundActive,
      roundEndsAt: this.roundEndsAt,
    };
  }
}

