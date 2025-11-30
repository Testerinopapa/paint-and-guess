import { useQuery } from "@tanstack/react-query";

export interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{ name: string; birth_year: number | null; death_year: number | null }>;
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: {
    [key: string]: string; // e.g., "text/html": "url", "application/epub+zip": "url"
  };
  download_count: number;
}

export interface GutenbergResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutenbergBook[];
}

interface UseGutenbergBooksOptions {
  search?: string;
  topic?: string;
  page?: number;
  enabled?: boolean;
}

const GUTENDEX_BASE_URL = "https://gutendex.com";

async function fetchGutenbergBooks(options: UseGutenbergBooksOptions): Promise<GutenbergResponse> {
  const params = new URLSearchParams();
  
  if (options.search) {
    params.append("search", options.search);
  }
  if (options.topic) {
    params.append("topic", options.topic);
  }
  if (options.page) {
    params.append("page", options.page.toString());
  }

  const url = `${GUTENDEX_BASE_URL}/books/?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch books: ${response.status}`);
  }
  
  return response.json();
}

export function useGutenbergBooks(options: UseGutenbergBooksOptions = {}) {
  return useQuery({
    queryKey: ["gutenberg-books", options.search, options.topic, options.page],
    queryFn: () => fetchGutenbergBooks(options),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

