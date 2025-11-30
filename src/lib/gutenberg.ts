import type { GutenbergBook } from "@/hooks/useGutenbergBooks";

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  availability: string;
  status: string;
  action: string;
  gutenbergId: number;
  downloadUrl?: string;
  coverImageUrl?: string;
  subjects: string[];
  downloadCount: number;
}

// Map Gutenberg subjects to your categories
const subjectToCategory: Record<string, string> = {
  "Fiction": "Fiction",
  "Mystery": "Mystery",
  "Biography": "Biography",
  "History": "Non-Fiction",
  "Science": "Non-Fiction",
  "Philosophy": "Non-Fiction",
  "Poetry": "Fiction",
  "Drama": "Fiction",
  "Adventure": "Fiction",
  "Romance": "Fiction",
  "Horror": "Fiction",
  "Fantasy": "Fiction",
  "Science fiction": "Fiction",
};

function getCategoryFromSubjects(subjects: string[]): string {
  for (const subject of subjects) {
    // Check for exact match
    if (subjectToCategory[subject]) {
      return subjectToCategory[subject];
    }
    // Check for partial match (case-insensitive)
    const lowerSubject = subject.toLowerCase();
    for (const [key, value] of Object.entries(subjectToCategory)) {
      if (lowerSubject.includes(key.toLowerCase())) {
        return value;
      }
    }
  }
  return "Fiction"; // Default
}

// Generate a color based on category for book covers
export function getCoverColor(category: string): string {
  const colorMap: Record<string, string> = {
    "Fiction": "bg-teal-500",
    "Mystery": "bg-blue-600",
    "Biography": "bg-green-400",
    "Non-Fiction": "bg-purple-500",
  };
  return colorMap[category] || "bg-gray-500";
}

export function transformGutenbergBook(book: GutenbergBook): LibraryBook {
  const author = book.authors.length > 0 
    ? book.authors.map(a => a.name).join(", ")
    : "Unknown Author";
  
  const category = getCategoryFromSubjects(book.subjects);
  
  // Get download URL (prefer HTML or plain text)
  const downloadUrl = book.formats["text/html"] 
    || book.formats["text/plain; charset=utf-8"]
    || book.formats["application/epub+zip"]
    || book.formats["text/plain"];

  return {
    id: `gutenberg-${book.id}`,
    title: book.title,
    author,
    category,
    availability: "Available", // All Gutenberg books are free
    status: "Free",
    action: "Read now",
    gutenbergId: book.id,
    downloadUrl,
    subjects: book.subjects,
    downloadCount: book.download_count,
  };
}

