import EnginePool from "../lib/enginePool.js";
import { prisma } from "../prismaClient.js";
import { parseFen, makeFen } from "chessops/fen";
import { setupPosition } from "chessops/variant";
import { parseSan } from "chessops/san";
import { squareFile, squareRank } from "chessops/util";
import { scoreToCp, calculateCpl, tagFromCpl, calculateAccuracy, calculateAcpl, detectOnlyMove, detectAgreement } from "../lib/moveEvaluation.js";

const logger = {
  info: (metadata, message) => {
    console.log(`[Report API] ${message}`, metadata || "");
  },
  error: (metadata, message) => {
    console.error(`[Report API] ${message}`, metadata || "");
  },
  debug: (metadata, message) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(`[Report API] ${message}`, metadata || "");
    }
  },
};

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Convert a chessops Move to UCI format
 */
function moveToUci(move) {
  if (!move) return null;
  
  const FILE_NAMES = "abcdefgh";
  const RANK_NAMES = "12345678";
  
  try {
    // chessops Move can be normal, drop, or null
    if (move === null || typeof move !== "object") return null;
    
    // Check if it's a normal move (has from and to)
    if (typeof move.from === "number" && typeof move.to === "number") {
      const fromFile = FILE_NAMES[squareFile(move.from)];
      const fromRank = RANK_NAMES[squareRank(move.from)];
      const toFile = FILE_NAMES[squareFile(move.to)];
      const toRank = RANK_NAMES[squareRank(move.to)];
      
      let uci = `${fromFile}${fromRank}${toFile}${toRank}`;
      
      if (move.promotion) {
        const promoMap = { queen: "q", rook: "r", bishop: "b", knight: "n" };
        uci += promoMap[move.promotion] || "q";
      }
      
      return uci;
    }
    
    return null;
  } catch (e) {
    // Fallback: try direct square number conversion
    try {
      if (typeof move.from === "number" && typeof move.to === "number") {
        const fromFile = FILE_NAMES[move.from & 7];
        const fromRank = RANK_NAMES[(move.from >> 3) & 7];
        const toFile = FILE_NAMES[move.to & 7];
        const toRank = RANK_NAMES[(move.to >> 3) & 7];
        
        let uci = `${fromFile}${fromRank}${toFile}${toRank}`;
        
        if (move.promotion) {
          const promoMap = { queen: "q", rook: "r", bishop: "b", knight: "n" };
          uci += promoMap[move.promotion] || "q";
        }
        
        return uci;
      }
    } catch {}
    
    return null;
  }
}

/**
 * Determine game phase based on move number
 */
function getPhase(moveNumber) {
  if (moveNumber <= 12) return "opening";
  if (moveNumber <= 40) return "middlegame";
  return "endgame";
}

/**
 * Generate a chess game analysis report
 * POST /api/report/generate
 */
export async function generateReport(req, res) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    let { fens, sans, pgn, depth = 12, elo = null, multiPv = 3, debug = false } = req.body;

    // If PGN provided, parse it to get FENs and SANs
    if (pgn && typeof pgn === "string" && (!fens || !sans || fens.length === 0 || sans.length === 0)) {
      try {
        const { parsePgn, startingPosition } = await import("chessops/pgn");
        const games = parsePgn(pgn);
        if (games.length > 0) {
          const game = games[0];
          const startRes = startingPosition(game.headers);
          if (startRes.isOk) {
            const pos = startRes.unwrap();
            const outSans = [];
            const outFens = [];
            
            for (const node of game.moves.mainline()) {
              const mv = parseSan(pos, node.san);
              if (!mv) break;
              pos.play(mv);
              outSans.push(node.san);
              outFens.push(makeFen(pos.toSetup()));
            }
            
            if (outSans.length > 0 && outSans.length === outFens.length) {
              sans = outSans;
              fens = outFens;
            }
          }
        }
      } catch (e) {
        logger.debug({ err: String(e) }, "PGN parsing failed, using provided fens/sans");
      }
    }

    // Validate inputs
    if (!Array.isArray(fens) || !Array.isArray(sans) || fens.length === 0 || sans.length === 0) {
      return res.status(400).json({ error: "Missing or invalid fens/sans arrays" });
    }

    if (fens.length !== sans.length) {
      // Trim to shorter length
      const n = Math.min(fens.length, sans.length);
      fens = fens.slice(0, n);
      sans = sans.slice(0, n);
    }

    const normalizedDepth = Math.max(1, Math.min(20, parseInt(depth, 10) || 12));
    const normalizedElo = typeof elo === "number" ? Math.max(1350, Math.min(2850, Math.floor(elo))) : null;
    const normalizedMultiPv = Math.max(1, Math.min(10, parseInt(multiPv, 10) || 3));

    logger.info(
      { reqId, moves: fens.length, depth: normalizedDepth, multiPv: normalizedMultiPv },
      "report_generation_start"
    );

    const evals = [];
    const cpls = [];
    const tags = [];
    const agreements = [];
    const onlyMoves = [];
    const phases = [];

    // Analyze each move
    for (let i = 0; i < fens.length; i++) {
      const postFen = fens[i];
      const preFen = i === 0 ? INITIAL_FEN : fens[i - 1];
      const san = sans[i];

      // Get post-move evaluation
      const postAnalysis = await EnginePool.analyze({
        fen: postFen,
        depth: normalizedDepth,
        elo: normalizedElo ?? undefined,
        limitStrength: normalizedElo != null,
        multiPv: normalizedMultiPv,
      });
      const postCp = scoreToCp(postAnalysis.info?.score) ?? 0;
      evals.push(postCp);

      // Get pre-move best evaluation
      const preBest = await EnginePool.analyze({
        fen: preFen,
        depth: normalizedDepth,
        elo: normalizedElo ?? undefined,
        limitStrength: normalizedElo != null,
        multiPv: normalizedMultiPv,
      });
      const preBestCp = scoreToCp(preBest.info?.score) ?? 0;
      const bestIsMate = preBest.info?.score?.type === "mate";
      const bestMateVal = bestIsMate ? preBest.info.score.value : 0;

      // Derive played move UCI from SAN
      let playedUci = null;
      try {
        const setupRes = parseFen(preFen);
        if (setupRes.isOk) {
          const posRes = setupPosition("chess", setupRes.unwrap());
          if (posRes.isOk) {
            const pos = posRes.unwrap();
            const mv = parseSan(pos, san);
            if (mv) {
              playedUci = moveToUci(mv);
            }
          }
        }
      } catch (e) {
        logger.debug({ err: String(e), ply: i + 1 }, "Failed to parse SAN to UCI");
      }

      // Get evaluation of the played move (using searchmoves)
      let prePlayedCp = preBestCp;
      let playedIsMate = false;
      let playedMateVal = 0;
      
      if (playedUci) {
        try {
          const prePlayed = await EnginePool.analyze({
            fen: preFen,
            depth: normalizedDepth,
            elo: normalizedElo ?? undefined,
            limitStrength: normalizedElo != null,
            searchMoves: [playedUci],
            multiPv: normalizedMultiPv,
          });
          prePlayedCp = scoreToCp(prePlayed.info?.score) ?? preBestCp;
          playedIsMate = prePlayed.info?.score?.type === "mate";
          playedMateVal = playedIsMate ? prePlayed.info.score.value : 0;
        } catch (e) {
          logger.debug({ err: String(e), ply: i + 1 }, "Failed to analyze played move");
        }
      }

      // Calculate CPL
      const cpl = calculateCpl(preBestCp, prePlayedCp);
      cpls.push(cpl);

      // Assign tag
      const tag = tagFromCpl(cpl, bestIsMate, playedIsMate, bestMateVal, playedMateVal);
      tags.push(tag);

      // Detect agreement and only-move
      const agreement = detectAgreement(cpl, preBest.infos || []);
      const onlyMove = detectOnlyMove(preBest.infos || []);
      agreements.push(agreement);
      onlyMoves.push(onlyMove);

      // Determine phase
      const moveNumber = Math.floor(i / 2) + 1;
      phases.push(getPhase(moveNumber));

      if (debug) {
        logger.debug(
          {
            ply: i + 1,
            preBestCp,
            prePlayedCp,
            cpl,
            tag,
            agreement,
            onlyMove,
            playedUci,
          },
          "move_analysis"
        );
      }
    }

    // Calculate accuracy
    const accuracy = calculateAccuracy(cpls);

    // Determine result from final position
    let resultStr = "*";
    try {
      const lastFen = fens[fens.length - 1];
      const setupRes = parseFen(lastFen);
      if (setupRes.isOk) {
        const posRes = setupPosition("chess", setupRes.unwrap());
        if (posRes.isOk) {
          const pos = posRes.unwrap();
          const ctx = pos.ctx();
          if (pos.isEnd(ctx)) {
            const outcome = pos.outcome(ctx);
            if (outcome?.winner === "white") resultStr = "1-0";
            else if (outcome?.winner === "black") resultStr = "0-1";
            else resultStr = "1/2-1/2";
          }
        }
      }
    } catch (e) {
      logger.debug({ err: String(e) }, "Failed to determine result");
    }

    const pgnHeader = `[Result "${resultStr}"]\n`;

    // Store report in database
    const report = await prisma.report.create({
      data: {
        pgn: pgnHeader,
        depth: normalizedDepth,
        elo: normalizedElo,
        fens: JSON.stringify(fens),
        sans: JSON.stringify(sans),
        evals: JSON.stringify(evals),
        tags: JSON.stringify(tags),
        accuracy,
      },
    });

    logger.info({ reqId, reportId: report.id, accuracy }, "report_generated");

    // Return response with per-move data
    return res.json({
      id: report.id,
      accuracy,
      perMove: cpls.map((cpl, i) => ({
        ply: i + 1,
        cpl,
        tag: tags[i],
        agreement: agreements[i] ?? false,
        onlyMove: onlyMoves[i] ?? false,
        phase: phases[i],
      })),
    });
  } catch (error) {
    logger.error({ reqId, err: String(error), stack: error.stack }, "report_generation_failed");
    return res.status(500).json({
      error: "Report generation failed",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get report details with full analysis
 * GET /api/report/latest/details
 */
export async function getReportDetails(req, res) {
  try {
    const latest = await prisma.report.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      return res.status(404).json({ error: "No report found" });
    }

    // Parse stored data
    let fens = [];
    let sans = [];
    let evals = [];
    let tags = [];
    
    try {
      fens = JSON.parse(latest.fens);
      sans = JSON.parse(latest.sans);
      evals = JSON.parse(latest.evals);
      tags = JSON.parse(latest.tags);
    } catch (e) {
      return res.status(400).json({ error: "Invalid stored report data" });
    }

    if (fens.length === 0 || sans.length === 0 || fens.length !== sans.length) {
      return res.status(400).json({ error: "Invalid report data" });
    }

    const depth = latest.depth ?? 12;
    const elo = latest.elo ?? null;
    const multiPv = 3;

    // Re-analyze to get full details (agreement, only-move, PVs, etc.)
    const perMove = [];
    
    for (let i = 0; i < fens.length; i++) {
      const preFen = i === 0 ? INITIAL_FEN : fens[i - 1];
      const san = sans[i];

      // Get pre-move analysis
      const preBest = await EnginePool.analyze({
        fen: preFen,
        depth,
        elo: elo ?? undefined,
        limitStrength: elo != null,
        multiPv,
      });

      const preBestCp = scoreToCp(preBest.info?.score) ?? 0;
      const bestIsMate = preBest.info?.score?.type === "mate";
      const bestMateVal = bestIsMate ? preBest.info.score.value : 0;

      // Parse SAN to UCI
      let playedUci = null;
      try {
        const setupRes = parseFen(preFen);
        if (setupRes.isOk) {
          const posRes = setupPosition("chess", setupRes.unwrap());
          if (posRes.isOk) {
            const pos = posRes.unwrap();
            const mv = parseSan(pos, san);
            if (mv) playedUci = moveToUci(mv);
          }
        }
      } catch {}

      // Get played move evaluation
      let prePlayedCp = preBestCp;
      let playedIsMate = false;
      let playedMateVal = 0;
      let playedPv = undefined;

      if (playedUci) {
        const prePlayed = await EnginePool.analyze({
          fen: preFen,
          depth,
          elo: elo ?? undefined,
          limitStrength: elo != null,
          searchMoves: [playedUci],
          multiPv,
        });
        prePlayedCp = scoreToCp(prePlayed.info?.score) ?? preBestCp;
        playedIsMate = prePlayed.info?.score?.type === "mate";
        playedMateVal = playedIsMate ? prePlayed.info.score.value : 0;
        playedPv = prePlayed.info?.pv;
      }

      const cpl = calculateCpl(preBestCp, prePlayedCp);
      const tag = tagFromCpl(cpl, bestIsMate, playedIsMate, bestMateVal, playedMateVal);
      const agreement = detectAgreement(cpl, preBest.infos || []);
      const onlyMove = detectOnlyMove(preBest.infos || []);
      const moveNumber = Math.floor(i / 2) + 1;
      const phase = getPhase(moveNumber);
      const bestPv = preBest.info?.pv;

      perMove.push({
        ply: i + 1,
        cpl,
        tag,
        agreement,
        onlyMove,
        bestPv,
        playedPv,
        phase,
      });
    }

    // Calculate aggregates per side
    const whiteCpls = [];
    const blackCpls = [];
    const tagCounts = {};

    for (const pm of perMove) {
      if (pm.ply % 2 === 1) {
        whiteCpls.push(pm.cpl);
      } else {
        blackCpls.push(pm.cpl);
      }
      tagCounts[pm.tag] = (tagCounts[pm.tag] || 0) + 1;
    }

    const acplWhite = calculateAcpl(whiteCpls);
    const acplBlack = calculateAcpl(blackCpls);
    const accuracyWhite = calculateAccuracy(whiteCpls);
    const accuracyBlack = calculateAccuracy(blackCpls);

    // Phase breakdown
    const phaseAgg = {
      opening: { whiteCpls: [], blackCpls: [], tagCounts: {} },
      middlegame: { whiteCpls: [], blackCpls: [], tagCounts: {} },
      endgame: { whiteCpls: [], blackCpls: [], tagCounts: {} },
    };

    for (const pm of perMove) {
      const bucket = phaseAgg[pm.phase];
      if (pm.ply % 2 === 1) {
        bucket.whiteCpls.push(pm.cpl);
      } else {
        bucket.blackCpls.push(pm.cpl);
      }
      bucket.tagCounts[pm.tag] = (bucket.tagCounts[pm.tag] || 0) + 1;
    }

    const perPhase = (ph) => {
      const p = phaseAgg[ph];
      return {
        acplWhite: calculateAcpl(p.whiteCpls),
        acplBlack: calculateAcpl(p.blackCpls),
        accuracyWhite: calculateAccuracy(p.whiteCpls),
        accuracyBlack: calculateAccuracy(p.blackCpls),
        tagCounts: p.tagCounts,
      };
    };

    return res.json({
      id: latest.id,
      perMove,
      aggregates: {
        acplWhite,
        acplBlack,
        accuracyWhite,
        accuracyBlack,
        tagCounts,
        phases: {
          opening: perPhase("opening"),
          middlegame: perPhase("middlegame"),
          endgame: perPhase("endgame"),
        },
      },
    });
  } catch (error) {
    logger.error({ err: String(error), stack: error.stack }, "get_report_details_failed");
    return res.status(500).json({
      error: "Failed to get report details",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get a specific report by ID
 * GET /api/report/:id
 */
export async function getReportById(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing report ID" });
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    return res.json(report);
  } catch (error) {
    logger.error({ err: String(error) }, "get_report_by_id_failed");
    return res.status(500).json({
      error: "Failed to get report",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

