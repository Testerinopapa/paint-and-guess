import { TriviaRoom } from "./triviaRoom.js";

export class TriviaRoomRepository {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomData) {
    const room = new TriviaRoom(roomData);
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) ?? null;
  }

  getRoomByPin(pin) {
    for (const room of this.rooms.values()) {
      if (room.gamePin === pin) {
        return room;
      }
    }
    return null;
  }

  deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  getRooms() {
    return Array.from(this.rooms.values());
  }

  listPublicRooms() {
    return this.getRooms().filter((room) => room.isPublic);
  }
}

