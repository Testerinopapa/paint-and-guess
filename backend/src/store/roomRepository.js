import { GameRoom } from "../gameRoom.js";

export class RoomRepository {
  constructor(store) {
    this.store = store;
    this.rooms = new Map();
  }

  async initialize() {
    console.log(`[RoomRepository] 🔄 Initializing repository...`);
    const rooms = await this.store.getAllRooms();
    let resetCount = 0;

    for (const state of rooms) {
      const room = GameRoom.fromState(state);
      if (room.isGameActive || room.players.length > 0) {
        console.log(`[RoomRepository] 🔄 Resetting room ${room.id} (was active or had players)`);
        room.resetAfterRestart();
        await this.store.upsertRoom(room.serialize());
        resetCount++;
      }
      this.rooms.set(room.id, room);
    }
    console.log(`[RoomRepository] ✅ Initialized: ${this.rooms.size} rooms loaded, ${resetCount} reset`);
  }

  getRoom(roomId) {
    const room = this.rooms.get(roomId) ?? null;
    if (room) {
      const activeCount = room.getActivePlayerCount?.() ?? 0;
      console.log(`[RoomRepository] 🔍 getRoom(${roomId}): found, ${activeCount}/${room.players.length} active players`);
    } else {
      console.log(`[RoomRepository] 🔍 getRoom(${roomId}): not found`);
    }
    return room;
  }

  getRooms() {
    return Array.from(this.rooms.values());
  }

  async createRoom(config) {
    console.log(`[RoomRepository] ➕ createRoom(${config.id}): ${config.name}, maxPlayers: ${config.maxPlayers}, wordPack: ${config.wordPack}`);
    const room = new GameRoom(config);
    this.rooms.set(room.id, room);
    await this.store.upsertRoom(room.serialize());
    return room;
  }

  async saveRoom(room) {
    const activeCount = room.getActivePlayerCount?.() ?? 0;
    console.log(`[RoomRepository] 💾 saveRoom(${room.id}): ${activeCount}/${room.players.length} active, gameActive: ${room.isGameActive}, round: ${room.roundNumber}`);
    this.rooms.set(room.id, room);
    await this.store.upsertRoom(room.serialize());
  }

  async deleteRoom(roomId) {
    console.log(`[RoomRepository] 🗑️ deleteRoom(${roomId})`);
    this.rooms.delete(roomId);
    await this.store.deleteRoom(roomId);
  }

  listPublicRooms() {
    return this.getRooms().filter((room) => room.isPublic);
  }
}
