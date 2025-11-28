export class TriviaRoom {
  constructor({
    id,
    name,
    isPublic = true,
    maxPlayers = 12,
    questions = [],
    players = [],
    isGameActive = false,
    ownerId = null,
    currentQuestionIndex = 0,
    phase = "lobby",
    gamePin = null,
    questionStartTime = null,
    answerStats = {},
  }) {
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.maxPlayers = maxPlayers;
    this.questions = questions;
    this.players = players.map((player) => ({
      ...player,
      connected: player.connected ?? false,
      score: player.score ?? 0,
      streak: player.streak ?? 0,
      hasAnswered: player.hasAnswered ?? false,
      answerTime: player.answerTime ?? null,
      lastSeen: player.lastSeen ?? Date.now(),
      socketId: player.socketId ?? null,
    }));
    this.isGameActive = isGameActive;
    this.ownerId = ownerId;
    this.currentQuestionIndex = currentQuestionIndex;
    this.phase = phase;
    this.gamePin = gamePin || this.generatePin();
    this.questionStartTime = questionStartTime;
    this.answerStats = answerStats; // { optionId: count }
    this.questionTimer = null; // Timer reference for early termination
  }

  generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getPlayerById(playerId) {
    return this.players.find((player) => player.id === playerId) ?? null;
  }

  addPlayer(player) {
    if (this.getActivePlayerCount() >= this.maxPlayers) {
      throw new Error("Room is full");
    }

    const enrichedPlayer = {
      ...player,
      connected: true,
      score: player.score ?? 0,
      streak: player.streak ?? 0,
      hasAnswered: false,
      answerTime: null,
      lastSeen: Date.now(),
      socketId: player.socketId ?? null,
    };

    this.players.push(enrichedPlayer);
    this.#ensureOwner();
  }

  removePlayer(playerId) {
    this.players = this.players.filter((p) => p.id !== playerId);
    if (this.ownerId === playerId) {
      this.#ensureOwner();
    }
  }

  markPlayerConnected(playerId, socketId) {
    const player = this.getPlayerById(playerId);
    if (!player) return;

    player.connected = true;
    player.socketId = socketId;
    player.lastSeen = Date.now();
    this.#ensureOwner();
  }

  markPlayerDisconnected(playerId) {
    const player = this.getPlayerById(playerId);
    if (!player) return;

    player.connected = false;
    player.socketId = null;
    player.lastSeen = Date.now();

    if (this.ownerId === playerId) {
      this.#ensureOwner();
    }
  }

  getActivePlayerCount() {
    return this.players.filter((player) => player.connected).length;
  }

  getActivePlayers() {
    return this.players.filter((player) => player.connected);
  }

  startGame() {
    if (this.getActivePlayerCount() < 2) {
      throw new Error("Need at least 2 players");
    }
    if (this.questions.length === 0) {
      throw new Error("No questions available");
    }

    this.isGameActive = true;
    this.currentQuestionIndex = 0;
    this.phase = "question-intro";
    this.players = this.players.map((player) => ({
      ...player,
      score: 0,
      streak: 0,
      hasAnswered: false,
      answerTime: null,
    }));
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  submitAnswer(playerId, optionId, timeElapsed) {
    const player = this.getPlayerById(playerId);
    if (!player || !player.connected) {
      return { error: "Player not found" };
    }

    if (player.hasAnswered) {
      return { error: "Already answered" };
    }

    if (this.phase !== "question") {
      return { error: "Not in question phase" };
    }

    const question = this.getCurrentQuestion();
    if (!question) {
      return { error: "No active question" };
    }

    const isCorrect = optionId === question.correctOptionId;
    player.hasAnswered = true;
    player.answerTime = timeElapsed;

    // Update answer stats
    if (!this.answerStats[optionId]) {
      this.answerStats[optionId] = 0;
    }
    this.answerStats[optionId]++;

    // Calculate points
    const totalTime = question.timeLimit * 1000; // Convert to ms
    const timeLeft = Math.max(0, totalTime - timeElapsed);
    const points = this.calculatePoints(isCorrect, timeLeft, totalTime, player.streak);

    if (isCorrect) {
      player.score += points;
      player.streak += 1;
    } else {
      player.streak = 0;
    }

    return {
      success: true,
      isCorrect,
      points,
      newScore: player.score,
      newStreak: player.streak,
    };
  }

  calculatePoints(isCorrect, timeLeft, totalTime, streak) {
    if (!isCorrect) return 0;

    const BASE_POINTS = 1000;
    const speedFactor = timeLeft / totalTime; // 0-1
    const streakBonus = Math.min(streak * 100, 500); // Max 500 bonus
    return Math.round(BASE_POINTS * (0.5 + 0.5 * speedFactor) + streakBonus);
  }

  allPlayersAnswered() {
    // Exclude host (owner) from the check - host doesn't answer questions
    const activePlayers = this.getActivePlayers().filter((p) => p.id !== this.ownerId);
    return activePlayers.length > 0 && activePlayers.every((p) => p.hasAnswered);
  }

  clearQuestionTimer() {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;
    }
  }

  nextQuestion() {
    // Clear any existing timer when moving to next question
    this.clearQuestionTimer();
    
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.questions.length) {
      this.phase = "podium";
      this.isGameActive = false;
      return false;
    }
    this.phase = "question-intro";
    this.answerStats = {};
    this.players = this.players.map((player) => ({
      ...player,
      hasAnswered: false,
      answerTime: null,
    }));
    return true;
  }

  getLeaderboard() {
    // Exclude host (owner) from leaderboard since they don't play
    return this.getActivePlayers()
      .filter((player) => player.id !== this.ownerId)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        streak: player.streak,
      }));
  }

  getPodium() {
    // Exclude host (owner) from podium since they don't play
    const sorted = this.getActivePlayers()
      .filter((player) => player.id !== this.ownerId)
      .sort((a, b) => b.score - a.score);
    return {
      first: sorted[0] ? { id: sorted[0].id, name: sorted[0].name, score: sorted[0].score } : null,
      second: sorted[1] ? { id: sorted[1].id, name: sorted[1].name, score: sorted[1].score } : null,
      third: sorted[2] ? { id: sorted[2].id, name: sorted[2].name, score: sorted[2].score } : null,
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      maxPlayers: this.maxPlayers,
      gamePin: this.gamePin,
      players: this.getActivePlayers().map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        streak: p.streak,
        avatar: p.avatar ?? null,
      })),
      isGameActive: this.isGameActive,
      ownerId: this.ownerId,
      currentQuestionIndex: this.currentQuestionIndex,
      phase: this.phase,
      totalQuestions: this.questions.length,
    };
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      maxPlayers: this.maxPlayers,
      questions: this.questions,
      players: this.players.map(({ socketId, ...player }) => player),
      isGameActive: this.isGameActive,
      ownerId: this.ownerId,
      currentQuestionIndex: this.currentQuestionIndex,
      phase: this.phase,
      gamePin: this.gamePin,
      questionStartTime: this.questionStartTime,
      answerStats: this.answerStats,
    };
  }

  static fromState(state) {
    return new TriviaRoom(state);
  }

  #ensureOwner() {
    const currentOwner = this.ownerId ? this.getPlayerById(this.ownerId) : null;
    if (currentOwner?.connected) {
      return;
    }

    const activePlayers = this.getActivePlayers();
    this.ownerId = activePlayers[0]?.id ?? null;
  }
}

