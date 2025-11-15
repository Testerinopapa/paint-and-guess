import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "..", "data");
const ROOMS_FILE = join(DATA_DIR, "rooms.json");

/**
 * File-backed room repository
 * Persists room state to disk so rooms survive server restarts
 */
export class RoomRepository {
  constructor() {
    this.rooms = new Map();
    this.initialized = false;
  }

  /**
   * Initialize repository - load rooms from disk
   */
  async init() {
    if (this.initialized) return;

    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
      console.log(`[RoomRepository] Created data directory: ${DATA_DIR}`);
    }

    // Load rooms from file
    if (existsSync(ROOMS_FILE)) {
      try {
        const data = await readFile(ROOMS_FILE, "utf-8");
        const roomsData = JSON.parse(data);
        
        console.log(`[RoomRepository] 📦 Loading rooms from disk`, {
          count: roomsData.length,
          file: ROOMS_FILE,
        });
        
        // Import GameRoom dynamically to avoid circular dependency
        const { GameRoom } = await import("./gameRoom.js");
        
        for (const roomData of roomsData) {
          const room = GameRoom.fromJSON(roomData);
          this.rooms.set(room.id, room);
          console.log(`[RoomRepository] ✓ Loaded room`, {
            roomId: room.id,
            name: room.name,
            players: room.players.length,
            isActive: room.isGameActive,
            round: room.roundNumber,
          });
        }
        
        console.log(`[RoomRepository] ✅ Rooms loaded`, { count: this.rooms.size });
      } catch (error) {
        console.error(`[RoomRepository] ❌ Failed to load rooms:`, error);
        // Start fresh if file is corrupted
        this.rooms.clear();
      }
    } else {
      console.log(`[RoomRepository] ℹ️ No existing rooms file, starting fresh`);
    }

    this.initialized = true;
  }

  /**
   * Save all rooms to disk
   */
  async save() {
    try {
      const roomsData = Array.from(this.rooms.values()).map(room => room.serialize());
      await writeFile(ROOMS_FILE, JSON.stringify(roomsData, null, 2), "utf-8");
      console.log(`[RoomRepository] 💾 Saved rooms to disk`, {
        count: roomsData.length,
        file: ROOMS_FILE,
      });
    } catch (error) {
      console.error(`[RoomRepository] ❌ Failed to save rooms:`, error);
      throw error;
    }
  }

  /**
   * Get a room by ID
   */
  get(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Get all rooms
   */
  getAll() {
    return Array.from(this.rooms.values());
  }

  /**
   * Get all public rooms
   */
  getPublic() {
    return Array.from(this.rooms.values()).filter(room => room.isPublic);
  }

  /**
   * Set/update a room
   */
  async set(roomId, room) {
    this.rooms.set(roomId, room);
    console.log(`[RoomRepository] ✏️ Set room`, {
      roomId,
      players: room.players.length,
      isActive: room.isGameActive,
      round: room.roundNumber,
    });
    await this.save();
  }

  /**
   * Delete a room
   */
  async delete(roomId) {
    const deleted = this.rooms.delete(roomId);
    if (deleted) {
      console.log(`[RoomRepository] 🗑️ Deleted room`, { roomId });
      await this.save();
    }
    return deleted;
  }

  /**
   * Check if a room exists
   */
  has(roomId) {
    return this.rooms.has(roomId);
  }

  /**
   * Get number of rooms
   */
  get size() {
    return this.rooms.size;
  }
}

// Singleton instance
export const roomRepository = new RoomRepository();

