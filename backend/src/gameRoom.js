export class GameRoom {
  constructor({
    id,
    name,
    isPublic,
    maxPlayers,
    roundTime,
    maxRounds = 6,
    wordPack = "classic",
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
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.maxPlayers = maxPlayers;
    this.roundTime = roundTime;
    this.maxRounds = maxRounds;
    this.wordPack = wordPack;
    this.players = players.map((player) => ({
      ...player,
      connected: player.connected ?? false,
      hasGuessed: player.hasGuessed ?? false,
      isReady: player.isReady ?? false,
      score: player.score ?? 0,
      avatar: player.avatar ?? null,
      lastSeen: player.lastSeen ?? Date.now(),
      socketId: player.socketId ?? null,
    }));
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
  }

  /**
   * Get a player by their stable ID
   */
  getPlayerById(playerId) {
    return this.players.find((player) => player.id === playerId) ?? null;
  }

  /**
   * Add a new player to the room
   * Player object should have: id, name, socketId, avatar (optional)
   */
  addPlayer(player) {
    if (this.getActivePlayerCount() >= this.maxPlayers) {
      throw new Error("Room is full");
    }

    const enrichedPlayer = {
      ...player,
      connected: true,
      hasGuessed: player.hasGuessed ?? false,
      isReady: player.isReady ?? false,
      score: player.score ?? 0,
      avatar: player.avatar ?? null,
      lastSeen: Date.now(),
      socketId: player.socketId ?? null,
    };

    this.players.push(enrichedPlayer);
    this.#ensureOwner();
  }

  removePlayer(playerId) {
    const wasDrawer = this.currentDrawer?.id === playerId;
    this.players = this.players.filter((p) => p.id !== playerId);

    if (wasDrawer) {
      this.currentDrawer = null;
      console.log(`[GameRoom:${this.id}] 🎨 Drawer disconnected`);
    }

    if (this.ownerId === playerId) {
      this.#ensureOwner();
    }
  }

  markPlayerConnected(playerId, socketId) {
    const player = this.getPlayerById(playerId);
    if (!player) {
      console.log(`[GameRoom:${this.id}] ⚠️ markPlayerConnected: player ${playerId} not found`);
      return;
    }

    const wasConnected = player.connected;
    player.connected = true;
    player.socketId = socketId;
    player.lastSeen = Date.now();
    this.#ensureOwner();

    if (this.currentDrawer?.id === playerId) {
      this.currentDrawer = player;
      console.log(`[GameRoom:${this.id}] 🎨 Drawer ${player.name} reconnected`);
    }

    if (!wasConnected) {
      console.log(`[GameRoom:${this.id}] ✅ Player ${player.name} (${playerId}) connected, active: ${this.getActivePlayerCount()}/${this.maxPlayers}`);
    }
  }

  markPlayerDisconnected(playerId) {
    const player = this.getPlayerById(playerId);
    if (!player) {
      console.log(`[GameRoom:${this.id}] ⚠️ markPlayerDisconnected: player ${playerId} not found`);
      return;
    }

    const wasDrawer = this.currentDrawer?.id === playerId;
    const wasOwner = this.ownerId === playerId;
    const activeBefore = this.getActivePlayerCount();

    player.connected = false;
    player.socketId = null;
    player.isReady = false;
    player.hasGuessed = false;
    player.lastSeen = Date.now();

    if (wasDrawer) {
      this.currentDrawer = null;
      console.log(`[GameRoom:${this.id}] 🎨 Drawer ${player.name} disconnected`);
    }

    if (wasOwner) {
      this.#ensureOwner();
      console.log(`[GameRoom:${this.id}] 🎖️ Owner ${player.name} disconnected, new owner: ${this.ownerId ? this.getPlayerById(this.ownerId)?.name : 'none'}`);
    }

    const activeAfter = this.getActivePlayerCount();
    console.log(`[GameRoom:${this.id}] 🔌 Player ${player.name} (${playerId}) disconnected, active: ${activeAfter}/${this.players.length} (was ${activeBefore})`);
  }

  markPlayerHeartbeat(playerId) {
    const player = this.getPlayerById(playerId);
    if (!player) {
      console.log(`[GameRoom:${this.id}] ⚠️ markPlayerHeartbeat: player ${playerId} not found`);
      return false;
    }

    const previousLastSeen = player.lastSeen ?? 0;
    const now = Date.now();
    const timeSinceLastSeen = previousLastSeen > 0 ? now - previousLastSeen : null;
    player.lastSeen = now;

    console.debug(
      `[GameRoom:${this.id}] ❤️ Heartbeat from ${player.name} (${playerId})`,
      {
        wasConnected: player.connected,
        previousLastSeen: previousLastSeen || "never",
        timeSinceLastSeen: timeSinceLastSeen ? `${timeSinceLastSeen}ms` : "N/A",
        activePlayers: `${this.getActivePlayerCount()}/${this.players.length}`,
      }
    );

    if (!player.connected) {
      player.connected = true;
      console.log(
        `[GameRoom:${this.id}] ❤️‍🩹 Heartbeat revived player ${player.name} (${playerId}), active: ${this.getActivePlayerCount()}/${this.players.length}`
      );
      this.#ensureOwner();
    }

    return previousLastSeen === 0 || player.lastSeen - previousLastSeen > 0;
  }

  markStalePlayersDisconnected(staleThresholdMs) {
    if (!staleThresholdMs) {
      return [];
    }

    const now = Date.now();
    const cutoff = now - staleThresholdMs;
    let changed = false;
    const stalePlayers = [];

    console.debug(`[GameRoom:${this.id}] Checking for stale players`, {
      thresholdMs: staleThresholdMs,
      cutoffTime: new Date(cutoff).toISOString(),
      totalPlayers: this.players.length,
    });

    this.players = this.players.map((player) => {
      const lastSeen = player.lastSeen ?? 0;
      const timeSinceLastSeen = lastSeen > 0 ? now - lastSeen : null;

      if (player.connected && lastSeen > 0 && lastSeen < cutoff) {
        changed = true;
        const staleInfo = {
          id: player.id,
          name: player.name,
          lastSeen: new Date(lastSeen).toISOString(),
          timeSinceLastSeen: `${timeSinceLastSeen}ms`,
          wasDrawer: this.currentDrawer?.id === player.id,
        };
        stalePlayers.push({ id: player.id, name: player.name });

        console.debug(`[GameRoom:${this.id}] Marking player as stale`, staleInfo);

        const wasDrawer = this.currentDrawer?.id === player.id;
        if (wasDrawer) {
          this.currentDrawer = null;
          console.log(`[GameRoom:${this.id}] 🎨 Drawer ${player.name} marked stale`);
        }

        return {
          ...player,
          connected: false,
          socketId: null,
          isReady: false,
          hasGuessed: false,
        };
      } else if (player.connected) {
        console.debug(`[GameRoom:${this.id}] Player still active`, {
          playerId: player.id,
          playerName: player.name,
          lastSeen: new Date(lastSeen).toISOString(),
          timeSinceLastSeen: timeSinceLastSeen ? `${timeSinceLastSeen}ms` : "N/A",
        });
      }
      return player;
    });

    if (changed) {
      console.log(
        `[GameRoom:${this.id}] ⏱️ Marked ${stalePlayers.length} stale players disconnected: ${stalePlayers
          .map((player) => player.name)
          .join(", ")}`
      );
      const ownerIsConnected = this.ownerId ? this.getPlayerById(this.ownerId)?.connected : false;
      if (!ownerIsConnected) {
        this.#ensureOwner();
      }
    } else {
      console.debug(`[GameRoom:${this.id}] No stale players found`);
    }

    return stalePlayers;
  }

  pruneDisconnectedPlayers(gracePeriodMs) {
    if (!gracePeriodMs) {
      return false;
    }

    const now = Date.now();
    const cutoff = now - gracePeriodMs;
    const initialLength = this.players.length;
    const prunedPlayers = [];

    console.debug(`[GameRoom:${this.id}] Checking for players to prune`, {
      gracePeriodMs,
      cutoffTime: new Date(cutoff).toISOString(),
      totalPlayers: initialLength,
      disconnectedPlayers: this.players.filter((p) => !p.connected).length,
    });

    this.players = this.players.filter((player) => {
      if (player.connected) {
        return true;
      }

      const lastSeen = player.lastSeen ?? 0;
      const timeSinceLastSeen = lastSeen > 0 ? now - lastSeen : null;

      if (!lastSeen) {
        console.debug(`[GameRoom:${this.id}] Pruning player (no lastSeen)`, {
          playerId: player.id,
          playerName: player.name,
        });
        prunedPlayers.push(player.name);
        return false;
      }

      const shouldKeep = lastSeen >= cutoff;
      if (!shouldKeep) {
        console.debug(`[GameRoom:${this.id}] Pruning player (grace period expired)`, {
          playerId: player.id,
          playerName: player.name,
          lastSeen: new Date(lastSeen).toISOString(),
          timeSinceLastSeen: `${timeSinceLastSeen}ms`,
          gracePeriodMs,
        });
        prunedPlayers.push(player.name);
      } else {
        console.debug(`[GameRoom:${this.id}] Keeping disconnected player (within grace period)`, {
          playerId: player.id,
          playerName: player.name,
          lastSeen: new Date(lastSeen).toISOString(),
          timeSinceLastSeen: `${timeSinceLastSeen}ms`,
          remainingGraceMs: lastSeen - cutoff,
        });
      }
      return shouldKeep;
    });

    if (this.players.length !== initialLength) {
      console.log(`[GameRoom:${this.id}] 🧹 Pruned ${initialLength - this.players.length} players: ${prunedPlayers.join(', ')}`);
      if (this.currentDrawer && !this.players.find((p) => p.id === this.currentDrawer.id)) {
        this.currentDrawer = null;
        console.log(`[GameRoom:${this.id}] 🎨 Drawer was pruned`);
      }
      if (this.ownerId && !this.players.find((p) => p.id === this.ownerId)) {
        this.#ensureOwner();
        console.log(`[GameRoom:${this.id}] 🎖️ Owner was pruned, new owner: ${this.ownerId ? this.getPlayerById(this.ownerId)?.name : 'none'}`);
      }
      return true;
    } else {
      console.debug(`[GameRoom:${this.id}] No players pruned`);
    }

    return false;
  }

  getActivePlayerCount() {
    return this.players.filter((player) => player.connected).length;
  }

  getActivePlayers() {
    return this.players.filter((player) => player.connected);
  }

  setPlayerReady(playerId, isReady) {
    const player = this.players.find((p) => p.id === playerId && p.connected);
    if (!player) {
      return;
    }
    player.isReady = isReady;
  }

  allPlayersReady() {
    const activePlayers = this.getActivePlayers();
    return activePlayers.length >= 2 && activePlayers.every((player) => player.isReady);
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

  shouldEndGame() {
    return this.roundNumber >= this.maxRounds || this.getActivePlayerCount() < 2;
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

  /**
   * Serialize room for network transmission (excludes sensitive data)
   */
  toJSON() {
    const drawer = this.currentDrawer?.connected ? this.currentDrawer : null;

    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      maxPlayers: this.maxPlayers,
      roundTime: this.roundTime,
      maxRounds: this.maxRounds,
      wordPack: this.wordPack,
      players: this.getActivePlayers().map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isReady: p.isReady,
        avatar: p.avatar ?? null,
      })),
      isGameActive: this.isGameActive,
      ownerId: this.ownerId,
      currentDrawer: drawer
        ? {
            id: drawer.id,
            name: drawer.name,
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
      wordPack: this.wordPack,
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
    // Clear transient runtime state while keeping dormant player records so they can reconnect
    this.players = this.players.map((player) => ({
      ...player,
      connected: false,
      socketId: null,
      isReady: false,
      hasGuessed: false,
      lastSeen: Date.now(),
    }));
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

  #ensureOwner() {
    const currentOwner = this.ownerId ? this.getPlayerById(this.ownerId) : null;
    if (currentOwner?.connected) {
      return;
    }

    const activePlayers = this.getActivePlayers();
    this.ownerId = activePlayers[0]?.id ?? null;
  }
}
