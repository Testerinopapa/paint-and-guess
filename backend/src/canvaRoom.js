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
    this.nextRound(getRandomWord);
  }

  nextRound(getRandomWord) {
    const activePlayers = this.getActivePlayers();

    if (activePlayers.length < 2) {
      throw new Error("Not enough active players");
    }

    if (this.roundNumber >= this.maxRounds) {
      throw new Error("Maximum rounds reached");
    }

    // Reset player guess states
    this.players = this.players.map((player) => ({
      ...player,
      hasGuessed: false,
    }));

    this.drawerRewarded = false;

    // Rotate drawer
    if (!this.currentDrawer || !this.currentDrawer.connected) {
      // First round or previous drawer disconnected - pick random active player
      this.currentDrawer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    } else {
      // Find current drawer index within active players and move to next
      const currentIndex = activePlayers.findIndex((p) => p.id === this.currentDrawer.id);
      const nextIndex = (currentIndex + 1) % activePlayers.length;
      this.currentDrawer = activePlayers[nextIndex];
    }

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

    const tick = () => {
      const timeLeft = this.getTimeRemainingSeconds();
      this.elapsedTime = Math.max(0, this.roundTime - timeLeft);
      Promise.resolve(onTick(timeLeft)).catch((error) => {
        console.error("Failed to handle round timer tick", error);
      });

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
        score: p.score,
        isReady: p.isReady,
        hasGuessed: p.hasGuessed,
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

