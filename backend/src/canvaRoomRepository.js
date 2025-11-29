import { CanvaRoom } from "./canvaRoom.js";

export class CanvaRoomRepository {
  constructor() {
    this.rooms = new Map();
  }

  createRoom({ name, isPublic = true, maxPlayers = 10 }) {
    const id = `canva-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const room = new CanvaRoom({
      id,
      name,
      isPublic,
      maxPlayers,
    });
    this.rooms.set(id, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) ?? null;
  }

  getRoomByPin(gamePin) {
    for (const room of this.rooms.values()) {
      if (room.gamePin === gamePin) {
        return room;
      }
    }
    return null;
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  getRooms() {
    return Array.from(this.rooms.values());
  }

  listPublicRooms() {
    return Array.from(this.rooms.values())
      .filter((room) => room.isPublic && room.getActivePlayerCount() > 0)
      .map((room) => room.toJSON());
  }
}

export const canvaRoomRepository = new CanvaRoomRepository();

