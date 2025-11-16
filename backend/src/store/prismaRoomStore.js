import { prisma } from "../prismaClient.js";

export class PrismaRoomStore {
  constructor() {}

  async getAllRooms() {
    try {
      const rows = await prisma.room.findMany();
      return rows.map((r) => this.#ensureParsed(r));
    } catch (error) {
      if (
        error.code === "P2021" ||
        error.message?.includes("file is not a database") ||
        error.message?.includes("no such table") ||
        error.message?.includes("does not exist")
      ) {
        throw new Error(
          "Database not initialized. Please run: cd backend && npm run prisma:migrate (with DATABASE_URL set)"
        );
      }
      throw error;
    }
  }

  async getRoom(roomId) {
    const row = await prisma.room.findUnique({ where: { id: roomId } });
    return row ? this.#ensureParsed(row) : null;
  }

  async upsertRoom(roomState) {
    await prisma.room.upsert({
      where: { id: roomState.id },
      create: {
        id: roomState.id,
        state: JSON.stringify(roomState),
      },
      update: {
        state: JSON.stringify(roomState),
      },
    });
    return this.getRoom(roomState.id);
  }

  async deleteRoom(roomId) {
    await prisma.room.delete({ where: { id: roomId } }).catch(() => {});
  }

  async count() {
    return prisma.room.count();
  }

  async listIds() {
    const rows = await prisma.room.findMany({ select: { id: true } });
    return rows.map((r) => r.id);
  }

  #ensureParsed(row) {
    // SQLite stores state as TEXT; parse to object
    const state = row.state;
    return typeof state === "string" ? JSON.parse(state) : state;
  }
}


