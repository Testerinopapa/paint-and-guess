/* eslint-disable no-console */
import { io, Socket } from "socket.io-client";

type Health = {
	status: string;
	store: string;
	databaseUrl: string | null;
	rooms: { inMemory: number; inDatabase: number | null };
};

async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${url} -> ${res.status}`);
	return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`${url} -> ${res.status}`);
	return (await res.json()) as T;
}

async function run() {
	const baseUrl = "http://localhost:3001";

	console.log("🔎 Checking backend health...");
	const initialHealth = await getJson<Health>(`${baseUrl}/api/health`).catch((e) => {
		console.error("❌ Backend not reachable. Start backend first (npm run dev:backend).", e);
		process.exitCode = 1;
		throw e;
	});
	console.log("✅ Health:", initialHealth);

	console.log("🏠 Creating a room...");
	const created = await postJson<any>(`${baseUrl}/api/rooms`, {
		name: "Crawler Room",
		isPublic: true,
		maxPlayers: 6,
		roundTime: 30,
		maxRounds: 2,
		wordPack: "classic",
	});
	const roomId: string = created.roomId ?? created.id;
	console.log("✅ Room created:", roomId);

	console.log("🔌 Connecting two clients via Socket.io...");
	const URL = baseUrl;
	const clientA: Socket = io(URL, { transports: ["websocket"] });
	const clientB: Socket = io(URL, { transports: ["websocket"] });

	await new Promise<void>((resolve) => {
		let connected = 0;
		const onConnect = () => {
			connected += 1;
			if (connected === 2) resolve();
		};
		clientA.on("connect", onConnect);
		clientB.on("connect", onConnect);
	});
	console.log("✅ Both clients connected.");

	// Capture session IDs
	let aId: string | null = null;
	let bId: string | null = null;

	clientA.on("session", ({ playerId }) => {
		aId = playerId;
		console.log("A session:", aId);
	});
	clientB.on("session", ({ playerId }) => {
		bId = playerId;
		console.log("B session:", bId);
	});

	// Log basic events
	for (const c of [clientA, clientB]) {
		c.on("room-state", (s) => console.log(`[${c.id}] room-state`, { id: s.id, players: s.players?.length, ownerId: s.ownerId }));
		c.on("player-joined", (p) => console.log(`[${c.id}] player-joined`, p.player?.name));
		c.on("player-ready", (p) => console.log(`[${c.id}] player-ready`, p.playerId, p.isReady));
		c.on("game-started", (e) => console.log(`[${c.id}] game-started`, e.roundNumber));
		c.on("round-started", (e) => console.log(`[${c.id}] round-started`, e.roundNumber));
		c.on("round-timer", (e) => console.log(`[${c.id}] round-timer`, e.timeLeft));
		c.on("round-ended", (e) => console.log(`[${c.id}] round-ended`, e.roundNumber));
		c.on("game-ended", (e) => console.log(`[${c.id}] game-ended`, e.reason));
		c.on("error", (e) => console.log(`[${c.id}] error`, e?.message || e));
	}

	console.log("➡️ Joining room...");
	clientA.emit("join-room", { roomId, playerName: "Crawler A" });
	clientB.emit("join-room", { roomId, playerName: "Crawler B" });

	await delay(1000);

	console.log("✅ Setting both players ready...");
	clientA.emit("set-ready", { isReady: true });
	clientB.emit("set-ready", { isReady: true });

	await delay(500);

	console.log("▶️ Starting game from client A (host)...");
	clientA.emit("start-game");

	console.log("⏳ Letting the round run for a few seconds...");
	await delay(3500);

	console.log("📊 Health after game start:");
	const midHealth = await getJson<Health>(`${baseUrl}/api/health`);
	console.log(midHealth);

	console.log("🧪 Disconnecting client B to test persistence...");
	clientB.disconnect();

	await delay(1500);

	console.log("📊 Debug rooms snapshot:");
	const debugRooms = await getJson<any>(`${baseUrl}/api/debug/rooms`);
	console.log(JSON.stringify(debugRooms, null, 2));

	console.log("🧹 Cleaning up (disconnect A)...");
	clientA.disconnect();

	console.log("✅ Crawler finished.");
	process.exit(0);
}

run().catch((err) => {
	console.error("Crawler failed:", err);
	process.exit(1);
});


