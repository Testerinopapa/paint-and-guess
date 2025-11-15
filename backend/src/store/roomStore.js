import fs from "fs/promises";

export class RoomStore {
  constructor(filename) {
    this.filename = filename;
    this.cache = new Map();
    this.initialized = false;
  }

  async getAllRooms() {
    await this.#ensureLoaded();
    return Array.from(this.cache.values()).map((room) => this.#clone(room));
  }

  async getRoom(roomId) {
    await this.#ensureLoaded();
    const room = this.cache.get(roomId);
    return room ? this.#clone(room) : null;
  }

  async upsertRoom(roomState) {
    await this.#ensureLoaded();
    this.cache.set(roomState.id, this.#clone(roomState));
    await this.#persist();
    return this.getRoom(roomState.id);
  }

  async deleteRoom(roomId) {
    await this.#ensureLoaded();
    this.cache.delete(roomId);
    await this.#persist();
  }

  async listPublicRooms() {
    const rooms = await this.getAllRooms();
    return rooms.filter((room) => room.isPublic);
  }

  async #ensureLoaded() {
    if (this.initialized) {
      return;
    }

    try {
      const raw = await fs.readFile(this.filename, "utf-8");
      const parsed = JSON.parse(raw);
      this.cache = new Map(parsed.map((room) => [room.id, room]));
    } catch (error) {
      if (error.code === "ENOENT") {
        this.cache = new Map();
        await this.#persist();
      } else {
        throw error;
      }
    }

    this.initialized = true;
  }

  async #persist() {
    const serialized = JSON.stringify(Array.from(this.cache.values()), null, 2);
    await fs.writeFile(this.filename, serialized);
  }

  #clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
}
