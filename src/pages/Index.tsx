import { Header } from "@/components/Header";
import { Canvas } from "@/components/Canvas";

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
