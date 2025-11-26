import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrivia } from "../state/TriviaContext";
import AnswerButton from "./AnswerButton";
import QuestionTimer from "./QuestionTimer";

export default function PlayerView() {
  const { gameState, submitAnswer } = useTrivia();
  const question = gameState.currentQuestion;

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center">
          <p>Loading question...</p>
        </Card>
      </div>
    );
  }

  const handleAnswer = (optionId: string) => {
    if (gameState.hasAnswered) return;
    submitAnswer(optionId);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Question {gameState.currentQuestionIndex + 1} of {gameState.totalQuestions}
            </CardTitle>
            <QuestionTimer timeLimit={question.timeLimit} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {gameState.hasAnswered ? (
            <div className="text-center py-8">
              <p className="text-xl font-semibold mb-4">Answer submitted!</p>
              {gameState.lastAnswerResult && (
                <div>
                  {gameState.lastAnswerResult.isCorrect ? (
                    <p className="text-green-600 dark:text-green-400">
                      ✓ Correct! +{gameState.lastAnswerResult.points} points
                    </p>
                  ) : (
                    <p className="text-red-600 dark:text-red-400">✗ Incorrect</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Waiting for other players...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-lg text-muted-foreground">
                  Select your answer below
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {question.options.map((option) => (
                  <AnswerButton
                    key={option.id}
                    option={option}
                    onClick={() => handleAnswer(option.id)}
                    disabled={gameState.hasAnswered}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

