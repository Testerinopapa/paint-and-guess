import { Header } from "@/games/paint-and-guess/components/Header";
import { Canvas } from "@/games/paint-and-guess/components/Canvas";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8">
        <Canvas />
      </main>
    </div>
  );
};

export default Index;
