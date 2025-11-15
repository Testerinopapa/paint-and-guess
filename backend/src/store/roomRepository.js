import { GameRoom } from "../gameRoom.js";

export class RoomRepository {
  constructor(store) {
    this.store = store;
    this.rooms = new Map();
  }

  async initialize() {
    const rooms = await this.store.getAllRooms();

    for (const state of rooms) {
      const room = GameRoom.fromState(state);
      if (room.isGameActive || room.players.length > 0) {
        room.resetAfterRestart();
        await this.store.upsertRoom(room.serialize());
      }
      this.rooms.set(room.id, room);
    }
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) ?? null;
  }

  getRooms() {
    return Array.from(this.rooms.values());
  }

  async createRoom(config) {
    const room = new GameRoom(config);
    this.rooms.set(room.id, room);
    await this.store.upsertRoom(room.serialize());
    return room;
  }

  async saveRoom(room) {
    this.rooms.set(room.id, room);
    await this.store.upsertRoom(room.serialize());
  }

  async deleteRoom(roomId) {
    this.rooms.delete(roomId);
    await this.store.deleteRoom(roomId);
  }

  listPublicRooms() {
    return this.getRooms().filter((room) => room.isPublic);
  }
}
