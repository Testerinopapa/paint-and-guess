export class WhiteboardRoom {
  constructor({
    id,
    name,
    isPublic = true,
    maxPlayers = 20,
    players = [],
    ownerId = null,
    gamePin = null,
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
    }));
    this.ownerId = ownerId;
    this.gamePin = gamePin || this.generatePin();
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
  }

  getActivePlayerCount() {
    return this.players.filter((p) => p.connected).length;
  }

  updatePlayerAvatar(playerId, avatar) {
    const player = this.getPlayerById(playerId);
    if (!player) return;

    player.avatar = avatar;
  }

  #ensureOwner() {
    if (this.ownerId && this.getPlayerById(this.ownerId)?.connected) {
      return;
    }

    const firstConnected = this.players.find((p) => p.connected);
    this.ownerId = firstConnected?.id ?? null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      maxPlayers: this.maxPlayers,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        connected: p.connected,
        lastSeen: p.lastSeen,
      })),
      ownerId: this.ownerId,
      gamePin: this.gamePin,
    };
  }
}

