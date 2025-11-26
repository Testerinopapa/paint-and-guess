import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrivia } from "../state/TriviaContext";
import QuestionTimer from "./QuestionTimer";

export default function HostView() {
  const { gameState } = useTrivia();
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

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              Question {gameState.currentQuestionIndex + 1} of {gameState.totalQuestions}
            </CardTitle>
            <QuestionTimer timeLimit={question.timeLimit} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">{question.text}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option) => {
              const count = gameState.answerStats[option.id] || 0;
              const isCorrect = option.id === question.correctOptionId;
              return (
                <Card
                  key={option.id}
                  className={`p-6 border-2 ${
                    isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : "border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div
                        className="w-8 h-8 rounded-full mb-2"
                        style={{ backgroundColor: option.color }}
                      />
                      <p className="font-semibold text-lg">{option.text}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {count === 1 ? "answer" : "answers"}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="text-center text-muted-foreground">
            {gameState.players.filter((p) => {
              // Check if player has answered (we track this via answerStats)
              return Object.values(gameState.answerStats).some((count) => count > 0);
            }).length} / {gameState.players.length} players answered
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

