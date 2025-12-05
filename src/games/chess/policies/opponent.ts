import type { OpponentPolicy, Side, AIConfig } from "./types";

export function makeOpponentPolicy(aiConfig: AIConfig): OpponentPolicy {
  return {
    shouldEngineMove({ turn, playerColor, movesCount }: { turn: Side; playerColor: Side; movesCount: number }): boolean {
      console.log("[AI DEBUG] OpponentPolicy.shouldEngineMove called", {
        aiConfigEnabled: aiConfig.enabled,
        aiConfigColor: aiConfig.color,
        turn,
        playerColor,
        movesCount,
      });
      
      if (!aiConfig.enabled) {
        console.log("[AI DEBUG] OpponentPolicy: AI not enabled, returning false");
        return false;
      }
      
      // Engine moves when it's NOT the player's turn
      if (turn !== aiConfig.color) {
        console.log("[AI DEBUG] OpponentPolicy: Turn mismatch", {
          turn,
          aiColor: aiConfig.color,
          returning: false,
        });
        return false;
      }
      
      // CRITICAL: Prevent engine from moving first when human is white (from commit 5)
      // If AI is black and no moves have been made, wait for player to move first
      if (aiConfig.color === "black" && movesCount === 0) {
        console.log("[AI DEBUG] OpponentPolicy: AI is black and no moves made, waiting for player", {
          returning: false,
        });
        return false; // Wait for player to make first move
      }
      
      // If AI is white, it can move first (player is black)
      // If AI is black, it can move after player has made at least one move
      console.log("[AI DEBUG] OpponentPolicy: All checks passed, returning true");
      return true;
    },
  };
}

