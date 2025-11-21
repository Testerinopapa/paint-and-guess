import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;

export default function PingPongIndex() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused">("menu");
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const gameLoopRef = useRef<number>();

  const gameStateRef = useRef({
    player1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    player2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVelX: 5,
    ballVelY: 3,
    keys: { w: false, s: false, ArrowUp: false, ArrowDown: false },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "s" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        gameStateRef.current.keys[e.key as keyof typeof gameStateRef.current.keys] = true;
      }
      if (e.key === " ") {
        if (gameState === "playing") {
          setGameState("paused");
        } else if (gameState === "paused") {
          setGameState("playing");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "s" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        gameStateRef.current.keys[e.key as keyof typeof gameStateRef.current.keys] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = () => {
      const state = gameStateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Move paddles
      if (state.keys.w && state.player1Y > 0) {
        state.player1Y -= PADDLE_SPEED;
      }
      if (state.keys.s && state.player1Y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        state.player1Y += PADDLE_SPEED;
      }
      if (state.keys.ArrowUp && state.player2Y > 0) {
        state.player2Y -= PADDLE_SPEED;
      }
      if (state.keys.ArrowDown && state.player2Y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        state.player2Y += PADDLE_SPEED;
      }

      // Move ball
      state.ballX += state.ballVelX;
      state.ballY += state.ballVelY;

      // Ball collision with top/bottom
      if (state.ballY <= 0 || state.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
        state.ballVelY = -state.ballVelY;
      }

      // Ball collision with paddles
      if (
        state.ballX <= PADDLE_WIDTH &&
        state.ballY + BALL_SIZE >= state.player1Y &&
        state.ballY <= state.player1Y + PADDLE_HEIGHT
      ) {
        state.ballVelX = -state.ballVelX;
        state.ballX = PADDLE_WIDTH;
      }

      if (
        state.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
        state.ballY + BALL_SIZE >= state.player2Y &&
        state.ballY <= state.player2Y + PADDLE_HEIGHT
      ) {
        state.ballVelX = -state.ballVelX;
        state.ballX = CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE;
      }

      // Score
      if (state.ballX < 0) {
        setScore((s) => ({ ...s, player2: s.player2 + 1 }));
        resetBall();
      } else if (state.ballX > CANVAS_WIDTH) {
        setScore((s) => ({ ...s, player1: s.player1 + 1 }));
        resetBall();
      }

      // Draw
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, state.player1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, state.player2Y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE);

      // Center line
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const resetBall = () => {
    gameStateRef.current.ballX = CANVAS_WIDTH / 2;
    gameStateRef.current.ballY = CANVAS_HEIGHT / 2;
    gameStateRef.current.ballVelX = (Math.random() > 0.5 ? 1 : -1) * 5;
    gameStateRef.current.ballVelY = (Math.random() > 0.5 ? 1 : -1) * 3;
  };

  const startGame = () => {
    setScore({ player1: 0, player2: 0 });
    resetBall();
    setGameState("playing");
  };

  if (gameState === "menu") {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Ping Pong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Classic table tennis game</p>
              <div className="space-y-2">
                <p className="text-sm">Player 1: W/S keys</p>
                <p className="text-sm">Player 2: Arrow Up/Down keys</p>
                <p className="text-sm">Space: Pause/Resume</p>
              </div>
              <Button onClick={startGame} size="lg">
                Start Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Ping Pong</CardTitle>
            <div className="text-2xl font-bold">
              {score.player1} - {score.player2}
            </div>
          </div>
          {gameState === "paused" && (
            <p className="text-muted-foreground">Game Paused - Press Space to Resume</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border border-gray-300 rounded"
            />
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <Button variant="outline" onClick={() => setGameState("menu")}>
              Main Menu
            </Button>
            {gameState === "playing" && (
              <Button variant="outline" onClick={() => setGameState("paused")}>
                Pause
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

