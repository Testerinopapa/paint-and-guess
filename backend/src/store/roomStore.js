import { prisma } from "../prismaClient.js";

export class RoomStore {
  constructor(client = prisma) {
    this.prisma = client;
  }

  async getAllRooms() {
    const records = await this.prisma.room.findMany();
    return records.map((record) => this.#clone(record.state));
  }

  async getRoom(roomId) {
    if (!roomId) {
      return null;
    }
    const record = await this.prisma.room.findUnique({ where: { id: roomId } });
    return record ? this.#clone(record.state) : null;
  }

  async upsertRoom(roomState) {
    if (!roomState?.id) {
      throw new Error("Room state must include an id");
    }

    const state = this.#clone(roomState);
    const record = await this.prisma.room.upsert({
      where: { id: state.id },
      update: { state },
      create: { id: state.id, state },
    });

    return this.#clone(record.state);
  }

  async deleteRoom(roomId) {
    if (!roomId) {
      return;
    }

    try {
      await this.prisma.room.delete({ where: { id: roomId } });
    } catch (error) {
      if (error.code === "P2025") {
        return;
      }
      throw error;
    }
  }

  async listPublicRooms() {
    const rooms = await this.getAllRooms();
    return rooms.filter((room) => room.isPublic);
  }

  #clone(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }
}
