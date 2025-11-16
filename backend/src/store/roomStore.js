import fs from "fs/promises";

export class RoomStore {
  constructor(filename) {
    this.filename = filename;
    this.cache = new Map();
    this.initialized = false;
  }

  async getAllRooms() {
    await this.#ensureLoaded();
    const rooms = Array.from(this.cache.values()).map((room) => this.#clone(room));
    console.log(`[RoomStore] 📦 getAllRooms: ${rooms.length} rooms in cache`);
    return rooms;
  }

  async getRoom(roomId) {
    await this.#ensureLoaded();
    const room = this.cache.get(roomId);
    console.log(`[RoomStore] 🔍 getRoom(${roomId}): ${room ? 'found' : 'not found'}`);
    return room ? this.#clone(room) : null;
  }

  async upsertRoom(roomState) {
    await this.#ensureLoaded();
    const wasNew = !this.cache.has(roomState.id);
    this.cache.set(roomState.id, this.#clone(roomState));
    await this.#persist();
    console.log(`[RoomStore] 💾 upsertRoom(${roomState.id}): ${wasNew ? 'created' : 'updated'}, players: ${roomState.players?.length || 0}, active: ${roomState.isGameActive || false}`);
    return this.getRoom(roomState.id);
  }

  async deleteRoom(roomId) {
    await this.#ensureLoaded();
    const existed = this.cache.has(roomId);
    this.cache.delete(roomId);
    await this.#persist();
    console.log(`[RoomStore] 🗑️ deleteRoom(${roomId}): ${existed ? 'deleted' : 'not found'}`);
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
      console.log(`[RoomStore] 📂 Loaded ${this.cache.size} rooms from ${this.filename}`);
    } catch (error) {
      if (error.code === "ENOENT") {
        this.cache = new Map();
        await this.#persist();
        console.log(`[RoomStore] 📝 Created new store file: ${this.filename}`);
      } else {
        // Corrupted or invalid JSON - back up and reset store safely
        console.error(`[RoomStore] ❌ Failed to load store:`, error);
        try {
          const backupRaw = await fs.readFile(this.filename, "utf-8").catch(() => null);
          if (backupRaw !== null) {
            const backupPath = `${this.filename}.bak`;
            await fs.writeFile(backupPath, backupRaw).catch(() => {});
            console.log(`[RoomStore] 🧯 Backed up corrupted store to ${backupPath}`);
          }
        } catch {
          // Ignore backup failures
        }

        // Reset to an empty store to allow server to continue
        this.cache = new Map();
        await this.#persist();
        console.log(`[RoomStore] ♻️ Reset store due to corruption; starting with empty dataset`);
      }
    }

    this.initialized = true;
  }

  async #persist() {
    const serialized = JSON.stringify(Array.from(this.cache.values()), null, 2);
    await fs.writeFile(this.filename, serialized);
    console.log(`[RoomStore] 💾 Persisted ${this.cache.size} rooms to disk`);
  }

  #clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
}
