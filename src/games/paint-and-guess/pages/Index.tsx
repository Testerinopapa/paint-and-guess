import { Header } from "@/games/paint-and-guess/components/Header";
import { Canvas } from "@/games/paint-and-guess/components/Canvas";
import GameLayout from "@/games/paint-and-guess/components/GameLayout";

const Index = () => {
  return (
    <GameLayout title="Paint & Guess" description="Practice your drawing skills in solo mode">
      <Header />
      <main className="container mx-auto py-4 md:py-8">
        <Canvas />
      </main>
    </GameLayout>
  );
};

export default Index;
