export type GameDescriptor = {
  id: string;
  name: string;
  description: string;
  route: string;
  thumbnail: string;
};

export const gameRegistry: GameDescriptor[] = [
  {
    id: "paint-and-guess",
    name: "Paint & Guess",
    description:
      "Draw prompts, guess your friends' sketches, and keep the points flowing.",
    route: "/games/paint-and-guess",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "mystery-mashup",
    name: "Mystery Mashup",
    description: "A surprise party experience is brewing. Stay tuned!",
    route: "#",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "trivia-trails",
    name: "Trivia Trails",
    description: "Battle your friends with rapid-fire questions soon.",
    route: "#",
    thumbnail: "/placeholder.svg",
  },
];

export default gameRegistry;
