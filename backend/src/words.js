// Themed word packs for the game
export const WORD_PACKS = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "A mix of easy, medium, and hard words for all skill levels",
    icon: "🎯",
    words: [
      // Easy - Common objects
      "apple", "cat", "dog", "house", "car", "tree", "sun", "moon", "star", "fish",
      "bird", "book", "chair", "table", "door", "window", "flower", "cloud", "rain",
      "snow", "ball", "cup", "hat", "shoe", "phone", "computer", "key", "lock",
      
      // Medium - Actions and concepts
      "running", "jumping", "flying", "swimming", "dancing", "singing", "reading",
      "writing", "eating", "sleeping", "laughing", "crying", "thinking", "dreaming",
      "exploring", "discovering", "creating", "building", "destroying", "fixing",
      
      // Medium - Animals
      "elephant", "tiger", "lion", "bear", "rabbit", "mouse", "horse", "cow",
      "pig", "sheep", "chicken", "duck", "goose", "eagle", "owl", "parrot",
      "snake", "lizard", "turtle", "frog", "butterfly", "bee", "spider",
      
      // Medium - Food
      "pizza", "burger", "sandwich", "salad", "soup", "pasta", "rice", "bread",
      "cake", "cookie", "ice cream", "chocolate", "banana", "orange", "grape",
      "strawberry", "watermelon", "pineapple", "carrot", "potato", "tomato",
      
      // Hard - Complex objects
      "airplane", "helicopter", "submarine", "rocket", "telescope", "microscope",
      "camera", "guitar", "piano", "violin", "drums", "trumpet", "bicycle",
      "motorcycle", "train", "bus", "truck", "boat", "ship", "bridge", "tower",
      
      // Hard - Places and locations
      "beach", "mountain", "forest", "desert", "island", "city", "village",
      "castle", "palace", "temple", "church", "school", "hospital", "library",
      "museum", "theater", "stadium", "park", "zoo", "aquarium",
      
      // Hard - Abstract concepts
      "friendship", "love", "happiness", "sadness", "anger", "fear", "hope",
      "dream", "wish", "memory", "story", "adventure", "journey", "discovery",
      "miracle", "magic", "mystery", "secret", "treasure", "victory",
    ],
  },
  animals: {
    id: "animals",
    name: "Animals",
    description: "All creatures great and small",
    icon: "🐾",
    words: [
      "cat", "dog", "bird", "fish", "elephant", "tiger", "lion", "bear",
      "rabbit", "mouse", "horse", "cow", "pig", "sheep", "chicken", "duck",
      "goose", "eagle", "owl", "parrot", "snake", "lizard", "turtle", "frog",
      "butterfly", "bee", "spider", "whale", "shark", "dolphin", "penguin",
      "giraffe", "zebra", "monkey", "panda", "koala", "kangaroo", "deer",
      "fox", "wolf", "squirrel", "hedgehog", "hamster", "guinea pig",
    ],
  },
  food: {
    id: "food",
    name: "Food & Drinks",
    description: "Delicious dishes and tasty treats",
    icon: "🍕",
    words: [
      "pizza", "burger", "sandwich", "salad", "soup", "pasta", "rice", "bread",
      "cake", "cookie", "ice cream", "chocolate", "banana", "orange", "grape",
      "strawberry", "watermelon", "pineapple", "carrot", "potato", "tomato",
      "apple", "cheese", "milk", "coffee", "tea", "juice", "water", "soda",
      "hot dog", "taco", "sushi", "ramen", "steak", "chicken", "fish", "shrimp",
      "pancake", "waffle", "donut", "muffin", "pie", "candy", "popcorn",
    ],
  },
  nature: {
    id: "nature",
    name: "Nature",
    description: "The great outdoors and natural world",
    icon: "🌲",
    words: [
      "tree", "flower", "sun", "moon", "star", "cloud", "rain", "snow",
      "beach", "mountain", "forest", "desert", "island", "ocean", "river",
      "lake", "waterfall", "volcano", "cave", "valley", "hill", "meadow",
      "grass", "leaf", "branch", "root", "seed", "butterfly", "bee", "bird",
      "sunset", "sunrise", "rainbow", "storm", "wind", "thunder", "lightning",
    ],
  },
  actions: {
    id: "actions",
    name: "Actions & Verbs",
    description: "Things you do and activities",
    icon: "🏃",
    words: [
      "running", "jumping", "flying", "swimming", "dancing", "singing", "reading",
      "writing", "eating", "sleeping", "laughing", "crying", "thinking", "dreaming",
      "exploring", "discovering", "creating", "building", "destroying", "fixing",
      "walking", "climbing", "throwing", "catching", "kicking", "hitting", "pushing",
      "pulling", "lifting", "carrying", "dropping", "picking", "opening", "closing",
      "painting", "drawing", "playing", "watching", "listening", "speaking", "shouting",
    ],
  },
  objects: {
    id: "objects",
    name: "Everyday Objects",
    description: "Common items and things around you",
    icon: "📦",
    words: [
      "book", "chair", "table", "door", "window", "ball", "cup", "hat", "shoe",
      "phone", "computer", "key", "lock", "camera", "guitar", "piano", "violin",
      "drums", "trumpet", "bicycle", "motorcycle", "train", "bus", "truck",
      "boat", "ship", "airplane", "helicopter", "submarine", "rocket", "telescope",
      "microscope", "bridge", "tower", "lamp", "clock", "watch", "glasses",
      "umbrella", "backpack", "wallet", "pen", "pencil", "paper", "scissors",
    ],
  },
  places: {
    id: "places",
    name: "Places & Locations",
    description: "Where in the world?",
    icon: "🗺️",
    words: [
      "beach", "mountain", "forest", "desert", "island", "city", "village",
      "castle", "palace", "temple", "church", "school", "hospital", "library",
      "museum", "theater", "stadium", "park", "zoo", "aquarium", "restaurant",
      "cafe", "shop", "store", "market", "airport", "station", "hotel", "house",
      "apartment", "office", "factory", "farm", "barn", "garage", "basement",
    ],
  },
  emotions: {
    id: "emotions",
    name: "Emotions & Feelings",
    description: "Express yourself through feelings",
    icon: "❤️",
    words: [
      "friendship", "love", "happiness", "sadness", "anger", "fear", "hope",
      "dream", "wish", "memory", "story", "adventure", "journey", "discovery",
      "miracle", "magic", "mystery", "secret", "treasure", "victory", "joy",
      "excitement", "surprise", "confusion", "calm", "peace", "worry", "relief",
      "pride", "shame", "embarrassment", "confidence", "courage", "bravery",
    ],
  },
  fantasy: {
    id: "fantasy",
    name: "Fantasy & Magic",
    description: "Mythical creatures and magical worlds",
    icon: "✨",
    words: [
      "dragon", "unicorn", "wizard", "witch", "fairy", "elf", "dwarf", "giant",
      "knight", "princess", "prince", "king", "queen", "castle", "palace", "tower",
      "magic", "spell", "wand", "sword", "shield", "crown", "treasure", "gem",
      "crystal", "phoenix", "griffin", "mermaid", "vampire", "werewolf", "ghost",
      "monster", "demon", "angel", "goddess", "god", "temple", "altar", "scroll",
    ],
  },
  sports: {
    id: "sports",
    name: "Sports & Games",
    description: "Athletic activities and competitions",
    icon: "⚽",
    words: [
      "football", "soccer", "basketball", "baseball", "tennis", "volleyball",
      "golf", "swimming", "running", "cycling", "skiing", "snowboarding",
      "skating", "hockey", "boxing", "wrestling", "karate", "judo", "archery",
      "bowling", "darts", "chess", "checkers", "poker", "cards", "dice",
      "stadium", "field", "court", "track", "pool", "gym", "team", "player",
    ],
  },
  technology: {
    id: "technology",
    name: "Technology",
    description: "Modern tech and digital devices",
    icon: "💻",
    words: [
      "computer", "phone", "tablet", "laptop", "keyboard", "mouse", "monitor",
      "screen", "internet", "website", "app", "software", "hardware", "robot",
      "drone", "satellite", "rocket", "spaceship", "laser", "radar", "sensor",
      "camera", "microphone", "speaker", "headphones", "battery", "charger",
      "wifi", "bluetooth", "usb", "chip", "processor", "memory", "storage",
    ],
  },
};

// Default word pack (classic)
export const DEFAULT_WORD_PACK = "classic";

// Get all word packs as an array
export function getWordPacks() {
  return Object.values(WORD_PACKS);
}

// Get a specific word pack by ID
export function getWordPack(packId) {
  return WORD_PACKS[packId] || WORD_PACKS[DEFAULT_WORD_PACK];
}

// Get random word from a specific pack
export function getRandomWordFromPack(packId) {
  const pack = getWordPack(packId);
  return pack.words[Math.floor(Math.random() * pack.words.length)];
}

// Legacy export for backward compatibility
export const WORDS = WORD_PACKS.classic.words;

